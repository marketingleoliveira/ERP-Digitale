/**
 * Server functions do módulo fiscal.
 * Fachada única para o frontend chamar operações SEFAZ via useServerFn.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { focusAdapter, type FocusConfig } from "@/services/fiscal/focus.adapter";
import { buildFocusNfePayload } from "@/services/fiscal/nfe.builder";
import { logNfeAction } from "@/services/fiscal/logs.repository";
import { validarEmissao, formatarErrosParaUsuario } from "@/services/fiscal/nfe.validator";
import { arquivarDocumentosFiscais } from "@/services/fiscal/nfe.arquivo";
import { calcularTributosDaNota } from "@/services/fiscal/tax.integration";

async function getFocusConfig(supabase: {
  from: (t: string) => { select: (c: string) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } } }
}): Promise<{ empresa: Record<string, unknown>; cfg: FocusConfig }> {
  const { data: empresa, error } = await supabase.from("empresa").select("*").limit(1).maybeSingle();
  if (error) throw new Error(String(error));
  if (!empresa) throw new Error("Configure a Empresa em Configurações antes de operar NF-e.");
  const emp = empresa as Record<string, unknown>;
  if (emp.provedor_nfe !== "focus_nfe") {
    throw new Error("Provedor SEFAZ diferente de Focus NFe. Ajuste em DEV → Focus NFe.");
  }
  const token = (emp.focus_nfe_token as string | null) || process.env.FOCUS_NFE_TOKEN;
  if (!token) throw new Error("Token Focus NFe não configurado. Configure em DEV → Focus NFe.");
  return {
    empresa: emp,
    cfg: { token, ambiente: (emp.ambiente_nfe as "homologacao" | "producao") ?? "homologacao" },
  };
}

/* ==================== EMITIR NF-e ==================== */
export const emitirNFe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { notaId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const sb = supabase as unknown as Parameters<typeof getFocusConfig>[0];
    const { empresa, cfg } = await getFocusConfig(sb);

    const { data: nota, error: nErr } = await supabase.from("notas_fiscais").select("*").eq("id", data.notaId).maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nota) throw new Error("Nota fiscal não encontrada.");

    const { data: itens = [] } = await supabase.from("notas_fiscais_itens").select("*").eq("nota_fiscal_id", data.notaId);
    const notaRec = nota as Record<string, unknown>;
    const { data: dest } = notaRec.cliente_id
      ? await supabase.from("customers").select("*").eq("id", notaRec.cliente_id as string).maybeSingle()
      : { data: null };

    const errs = validarEmissao({
      empresa,
      cliente: (dest as Record<string, unknown> | null) ?? null,
      itens: (itens ?? []) as Record<string, unknown>[],
      hasToken: Boolean(process.env.FOCUS_NFE_TOKEN),
    });
    if (errs.length > 0) {
      throw new Error("NF-e bloqueada — dados incompletos:\n\n" + formatarErrosParaUsuario(errs));
    }

    const ref = `nfe-${notaRec.id as string}`;
    const itensBase = (itens ?? []) as Record<string, unknown>[];
    const destRec = (dest as Record<string, unknown> | null) ?? null;

    // Motor tributário — calcula CFOP/CST/CSOSN/ICMS/ST/IPI/PIS/COFINS/FCP/DIFAL/origem.
    // Bloqueia emissão se faltar regra fiscal aplicável.
    const { itensCalculados, totais } = await calcularTributosDaNota(
      supabase, empresa, notaRec, itensBase, destRec,
    );

    // Persiste totais recalculados na nota (fonte da verdade fiscal)
    await supabase.from("notas_fiscais").update({
      valor_produtos: totais.valor_produtos,
      valor_icms: totais.valor_icms,
      valor_icms_st: totais.valor_icms_st,
      valor_ipi: totais.valor_ipi,
      valor_pis: totais.valor_pis,
      valor_cofins: totais.valor_cofins,
      valor_total: totais.valor_total,
    } as never).eq("id", data.notaId);

    const payload = buildFocusNfePayload(empresa, { ...notaRec, ...totais }, itensCalculados, destRec);
    const res = await focusAdapter.emitir(cfg, ref, payload);

    await logNfeAction(supabase, {
      notaFiscalId: notaRec.id as string,
      acao: "emitir",
      request: payload, response: res.body, httpStatus: res.status, duracaoMs: res.durationMs, userId,
    });

    const body = res.body as Record<string, unknown>;
    if (!res.ok) {
      await supabase.from("notas_fiscais").update({
        status_sefaz: "rejeitada",
        mensagem_sefaz: String(body.mensagem ?? body.erros ?? res.status),
      }).eq("id", data.notaId);
      throw new Error(`SEFAZ rejeitou: ${body.mensagem ?? JSON.stringify(body.erros ?? {})}`);
    }

    const chave = body.chave_nfe as string | null | undefined;
    const protocolo = body.protocolo as string | null | undefined;
    const caminhoXml = body.caminho_xml_nota_fiscal as string | null | undefined;
    const caminhoDanfe = body.caminho_danfe as string | null | undefined;
    const dataEmissao = body.data_emissao as string | null | undefined;
    const statusStr = String(body.status ?? "processando");

    const autorizada = statusStr === "autorizado";
    let xmlUrl = caminhoXml ? `${focusAdapter.baseUrl(cfg)}${caminhoXml}` : null;
    let danfeUrl = caminhoDanfe ? `${focusAdapter.baseUrl(cfg)}${caminhoDanfe}` : null;

    if (autorizada && chave) {
      try {
        const arq = await arquivarDocumentosFiscais(
          supabase as unknown as Parameters<typeof arquivarDocumentosFiscais>[0],
          cfg, chave, { xml: caminhoXml, danfe: caminhoDanfe }
        );
        xmlUrl = arq.xmlSignedUrl ?? xmlUrl;
        danfeUrl = arq.pdfSignedUrl ?? danfeUrl;
        await logNfeAction(supabase, {
          notaFiscalId: notaRec.id as string, acao: "arquivar",
          response: { xmlPath: arq.xmlPath, pdfPath: arq.pdfPath }, httpStatus: 200, duracaoMs: 0, userId,
        });
      } catch (e) {
        await logNfeAction(supabase, {
          notaFiscalId: notaRec.id as string, acao: "arquivar",
          response: { erro: String(e instanceof Error ? e.message : e) }, httpStatus: 500, duracaoMs: 0, userId,
        });
      }
    }

    await supabase.from("notas_fiscais").update({
      status_sefaz: autorizada ? "autorizada" : "processando",
      chave_acesso: chave ?? null,
      protocolo_autorizacao: protocolo ?? null,
      xml_url: xmlUrl,
      danfe_url: danfeUrl,
      provedor_ref: ref,
      data_autorizacao: dataEmissao ?? null,
    }).eq("id", data.notaId);

    return { ok: true as const, status: statusStr, chave: chave ?? "", ref };
  });

/* ==================== CANCELAR ==================== */
export const cancelarNFe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { notaId: string; justificativa: string }) => {
    if (!i.justificativa || i.justificativa.trim().length < 15) {
      throw new Error("Justificativa deve ter no mínimo 15 caracteres.");
    }
    return i;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { cfg } = await getFocusConfig(supabase as never);
    const { data: nota } = await supabase.from("notas_fiscais").select("*").eq("id", data.notaId).maybeSingle();
    if (!nota) throw new Error("Nota não encontrada.");
    const notaRec = nota as Record<string, unknown>;
    const ref = (notaRec.provedor_ref as string) ?? `nfe-${notaRec.id as string}`;
    const res = await focusAdapter.cancelar(cfg, ref, data.justificativa);
    await logNfeAction(supabase, { notaFiscalId: notaRec.id as string, acao: "cancelar", request: data, response: res.body, httpStatus: res.status, duracaoMs: res.durationMs, userId });
    await supabase.from("nfe_eventos").insert({
      nota_fiscal_id: notaRec.id, tipo: "cancelamento",
      motivo: data.justificativa, payload: res.body,
      status: res.ok ? "sucesso" : "erro",
      mensagem: (res.body as Record<string, unknown>).mensagem as string ?? null,
      user_id: userId,
    } as never);
    if (res.ok) {
      await supabase.from("notas_fiscais").update({ status_sefaz: "cancelada" }).eq("id", data.notaId);
    }
    return { ok: res.ok, status: res.status, mensagem: String((res.body as Record<string,unknown>).mensagem ?? "") };
  });

/* ==================== CARTA DE CORREÇÃO ==================== */
export const emitirCCe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { notaId: string; correcao: string }) => {
    if (!i.correcao || i.correcao.trim().length < 15) throw new Error("Correção deve ter no mínimo 15 caracteres.");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { cfg } = await getFocusConfig(supabase as never);
    const { data: nota } = await supabase.from("notas_fiscais").select("*").eq("id", data.notaId).maybeSingle();
    if (!nota) throw new Error("Nota não encontrada.");
    const notaRec = nota as Record<string, unknown>;
    const ref = (notaRec.provedor_ref as string) ?? `nfe-${notaRec.id as string}`;
    const res = await focusAdapter.cartaCorrecao(cfg, ref, data.correcao);
    await logNfeAction(supabase, { notaFiscalId: notaRec.id as string, acao: "cce", request: data, response: res.body, httpStatus: res.status, duracaoMs: res.durationMs, userId });
    await supabase.from("nfe_eventos").insert({
      nota_fiscal_id: notaRec.id, tipo: "cce", motivo: data.correcao,
      payload: res.body, status: res.ok ? "sucesso" : "erro",
      mensagem: (res.body as Record<string, unknown>).mensagem as string ?? null, user_id: userId,
    } as never);
    return { ok: res.ok, status: res.status, mensagem: String((res.body as Record<string,unknown>).mensagem ?? "") };
  });

/* ==================== CONSULTAR ==================== */
export const consultarNFe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { notaId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { cfg } = await getFocusConfig(supabase as never);
    const { data: nota } = await supabase.from("notas_fiscais").select("*").eq("id", data.notaId).maybeSingle();
    if (!nota) throw new Error("Nota não encontrada.");
    const notaRec = nota as Record<string, unknown>;
    const ref = (notaRec.provedor_ref as string) ?? `nfe-${notaRec.id as string}`;
    const res = await focusAdapter.consultar(cfg, ref);
    await logNfeAction(supabase, { notaFiscalId: notaRec.id as string, acao: "consultar", response: res.body, httpStatus: res.status, duracaoMs: res.durationMs, userId });

    const body = res.body as Record<string, unknown>;
    const statusStr = String(body.status ?? "");
    const mapStatus: Record<string, string> = {
      autorizado: "autorizada", cancelado: "cancelada",
      denegado: "denegada", erro_autorizacao: "rejeitada", processando_autorizacao: "processando",
    };
    const novoStatus = mapStatus[statusStr];
    if (res.ok && novoStatus) {
      const chave = body.chave_nfe as string | null | undefined;
      const protocolo = body.protocolo as string | null | undefined;
      const caminhoXml = body.caminho_xml_nota_fiscal as string | null | undefined;
      const caminhoDanfe = body.caminho_danfe as string | null | undefined;
      const dataEmissao = body.data_emissao as string | null | undefined;

      let xmlUrl = caminhoXml ? `${focusAdapter.baseUrl(cfg)}${caminhoXml}` : (notaRec.xml_url as string | null) ?? null;
      let danfeUrl = caminhoDanfe ? `${focusAdapter.baseUrl(cfg)}${caminhoDanfe}` : (notaRec.danfe_url as string | null) ?? null;

      const jaArquivado = String((notaRec.xml_url as string | null) ?? "").includes("/storage/");
      if (novoStatus === "autorizada" && chave && !jaArquivado && (caminhoXml || caminhoDanfe)) {
        try {
          const arq = await arquivarDocumentosFiscais(
            supabase as unknown as Parameters<typeof arquivarDocumentosFiscais>[0],
            cfg, chave, { xml: caminhoXml, danfe: caminhoDanfe }
          );
          xmlUrl = arq.xmlSignedUrl ?? xmlUrl;
          danfeUrl = arq.pdfSignedUrl ?? danfeUrl;
          await logNfeAction(supabase, {
            notaFiscalId: notaRec.id as string, acao: "arquivar",
            response: { xmlPath: arq.xmlPath, pdfPath: arq.pdfPath }, httpStatus: 200, duracaoMs: 0, userId,
          });
        } catch (e) {
          await logNfeAction(supabase, {
            notaFiscalId: notaRec.id as string, acao: "arquivar",
            response: { erro: String(e instanceof Error ? e.message : e) }, httpStatus: 500, duracaoMs: 0, userId,
          });
        }
      }

      await supabase.from("notas_fiscais").update({
        status_sefaz: novoStatus,
        chave_acesso: chave ?? (notaRec.chave_acesso as string | null) ?? null,
        protocolo_autorizacao: protocolo ?? (notaRec.protocolo_autorizacao as string | null) ?? null,
        xml_url: xmlUrl,
        danfe_url: danfeUrl,
        data_autorizacao: dataEmissao ?? (notaRec.data_autorizacao as string | null) ?? null,
        mensagem_sefaz: (body.mensagem_sefaz ?? body.mensagem) as string ?? null,
      }).eq("id", data.notaId);
    } else if (!res.ok) {
      await supabase.from("notas_fiscais").update({
        mensagem_sefaz: String(body.mensagem ?? body.erros ?? res.status),
      }).eq("id", data.notaId);
    }

    return { ok: res.ok, status: res.status, situacao: novoStatus ?? statusStr, mensagem: String(body.mensagem ?? "") };
  });

/* ==================== INUTILIZAR ==================== */
export const inutilizarNFe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { serie: number; numero_inicial: number; numero_final: number; justificativa: string }) => {
    if (i.justificativa.trim().length < 15) throw new Error("Justificativa mín 15 chars.");
    if (i.numero_final < i.numero_inicial) throw new Error("Faixa inválida.");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { empresa, cfg } = await getFocusConfig(supabase as never);
    const cnpj = String(empresa.cnpj ?? "").replace(/\D/g, "");
    const res = await focusAdapter.inutilizar(cfg, {
      cnpj, serie: data.serie, numero_inicial: data.numero_inicial,
      numero_final: data.numero_final, justificativa: data.justificativa,
      ano: new Date().getFullYear(),
    });
    await logNfeAction(supabase, { notaFiscalId: null, acao: "inutilizar", request: data, response: res.body, httpStatus: res.status, duracaoMs: res.durationMs, userId });
    await supabase.from("nfe_eventos").insert({
      nota_fiscal_id: null, tipo: "inutilizacao", motivo: data.justificativa,
      payload: res.body, status: res.ok ? "sucesso" : "erro",
      mensagem: (res.body as Record<string, unknown>).mensagem as string ?? null, user_id: userId,
    } as never);
    return { ok: res.ok, status: res.status, mensagem: String((res.body as Record<string,unknown>).mensagem ?? "") };
  });
