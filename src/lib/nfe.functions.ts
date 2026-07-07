import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Emite NF-e via provedor configurado (Focus NFe ou PlugNotas).
 * Requer secret FOCUS_NFE_TOKEN ou PLUGNOTAS_TOKEN configurado.
 */
export const emitirNFe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { notaId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Carrega empresa (emissor)
    const { data: empresa, error: eErr } = await supabase
      .from("empresa")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (eErr) throw new Error(eErr.message);
    if (!empresa) throw new Error("Configure os dados da Empresa em Configurações antes de emitir NF-e.");

    // Carrega nota + itens
    const { data: nota, error: nErr } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("id", data.notaId)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!nota) throw new Error("Nota fiscal não encontrada.");

    const { data: itens } = await supabase
      .from("notas_fiscais_itens")
      .select("*")
      .eq("nota_fiscal_id", data.notaId);

    const provider = (empresa as { provedor_nfe?: string }).provedor_nfe ?? "nenhum";
    const ambiente = (empresa as { ambiente_nfe?: string }).ambiente_nfe ?? "homologacao";

    if (provider === "nenhum") {
      throw new Error(
        "Nenhum provedor SEFAZ configurado. Vá em Configurações → Empresa e selecione um provedor (Focus NFe ou PlugNotas)."
      );
    }

    // Focus NFe
    if (provider === "focus_nfe") {
      const token = process.env.FOCUS_NFE_TOKEN;
      if (!token) {
        throw new Error(
          "Secret FOCUS_NFE_TOKEN não configurado. Peça ao administrador para cadastrá-lo."
        );
      }
      const baseUrl =
        ambiente === "producao"
          ? "https://api.focusnfe.com.br"
          : "https://homologacao.focusnfe.com.br";

      const referencia = `nfe-${nota.id}`;
      const payload = buildFocusPayload(empresa, nota, itens ?? []);

      const res = await fetch(`${baseUrl}/v2/nfe?ref=${referencia}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${token}:`).toString("base64"),
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        await supabase
          .from("notas_fiscais")
          .update({ status_sefaz: "rejeitada", mensagem_sefaz: JSON.stringify(body) })
          .eq("id", data.notaId);
        throw new Error(`SEFAZ rejeitou: ${body.mensagem ?? body.erros?.[0]?.mensagem ?? res.statusText}`);
      }

      await supabase
        .from("notas_fiscais")
        .update({
          status_sefaz: body.status === "autorizado" ? "autorizada" : "processando",
          chave_acesso: body.chave_nfe ?? null,
          protocolo_autorizacao: body.protocolo ?? null,
          xml_url: body.caminho_xml_nota_fiscal ? `${baseUrl}${body.caminho_xml_nota_fiscal}` : null,
          danfe_url: body.caminho_danfe ? `${baseUrl}${body.caminho_danfe}` : null,
          provedor_ref: referencia,
          data_autorizacao: body.data_emissao ?? null,
        })
        .eq("id", data.notaId);

      return { ok: true, status: body.status, chave: body.chave_nfe, referencia };
    }

    // PlugNotas
    if (provider === "plugnotas") {
      const token = process.env.PLUGNOTAS_TOKEN;
      if (!token) throw new Error("Secret PLUGNOTAS_TOKEN não configurado.");
      // Implementação equivalente para PlugNotas
      throw new Error("Integração PlugNotas em desenvolvimento. Use Focus NFe por enquanto.");
    }

    throw new Error(`Provedor desconhecido: ${provider}`);
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFocusPayload(empresa: any, nota: any, itens: any[]) {
  return {
    natureza_operacao: nota.natureza_operacao ?? "Venda",
    data_emissao: nota.data_emissao,
    tipo_documento: nota.tipo === "entrada" ? 0 : 1,
    finalidade_emissao: 1,
    cnpj_emitente: empresa.cnpj?.replace(/\D/g, ""),
    nome_emitente: empresa.razao_social,
    logradouro_emitente: empresa.logradouro,
    numero_emitente: empresa.numero,
    bairro_emitente: empresa.bairro,
    municipio_emitente: empresa.cidade,
    uf_emitente: empresa.uf,
    cep_emitente: empresa.cep?.replace(/\D/g, ""),
    inscricao_estadual_emitente: empresa.inscricao_estadual,
    regime_tributario_emitente: empresa.regime_tributario === "simples" ? 1 : 3,
    valor_total: Number(nota.valor_total ?? 0),
    valor_produtos: Number(nota.valor_produtos ?? nota.valor_total ?? 0),
    modalidade_frete: 9,
    items: itens.map((i, idx) => ({
      numero_item: idx + 1,
      codigo_produto: i.produto_id ?? `ITEM${idx + 1}`,
      descricao: i.descricao ?? "",
      cfop: i.cfop ?? "5102",
      unidade_comercial: i.unidade ?? "UN",
      quantidade_comercial: Number(i.qtd_saida ?? i.quantidade ?? 1),
      valor_unitario_comercial: Number(i.valor_unitario ?? 0),
      valor_bruto: Number(i.valor_total ?? 0),
      unidade_tributavel: i.unidade ?? "UN",
      quantidade_tributavel: Number(i.qtd_saida ?? i.quantidade ?? 1),
      valor_unitario_tributavel: Number(i.valor_unitario ?? 0),
      icms_situacao_tributaria: "102",
      icms_origem: 0,
    })),
  };
}
