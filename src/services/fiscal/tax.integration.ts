/**
 * Integração do motor tributário com o fluxo Focus NFe.
 *
 * Antes da montagem do payload:
 *   - Carrega regras_tributarias, uf_aliquotas
 *   - Carrega origem (products.origem) e cest via variante_id
 *   - Monta TaxContext e roda calcularNota()
 *   - Bloqueia emissão se qualquer item não tiver regra compatível
 *   - Devolve itens enriquecidos (cfop, cst/csosn, alíquotas e valores)
 *     no formato aceito pelo buildFocusNfePayload.
 */

import { calcularNota } from "./tax-engine";
import type {
  TaxContext, ItemInput, ItemResult,
  RegraTributaria, UfAliquota, RegimeTributario,
  TipoCliente, TipoOperacao, Finalidade,
} from "./tax-engine/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

export interface TaxComputeResult {
  itensCalculados: Rec[];        // itens originais + campos fiscais calculados
  totais: ItemResult extends never ? never : import("./tax-engine/types").TotaisNota;
  avisos: string[];
}

function inferRegime(empresa: Rec): RegimeTributario {
  const crt = Number(empresa.crt ?? 0);
  if (crt === 1 || crt === 2) return "simples";
  const r = String(empresa.regime_tributario ?? "").toLowerCase();
  if (r.includes("simples")) return "simples";
  if (r.includes("presum")) return "presumido";
  return "real";
}

function inferTipoCliente(cli: Rec | null): TipoCliente {
  if (!cli) return "pf";
  const t = String(cli.tipo_cliente ?? "").toLowerCase();
  if (t === "pj_contribuinte" || t === "pj_nao_contrib" || t === "pf"
      || t === "orgao_publico" || t === "exterior") return t as TipoCliente;
  const contrib = cli.contribuinte_icms === true
    || Number(cli.indicador_ie) === 1;
  if (cli.cnpj) return contrib ? "pj_contribuinte" : "pj_nao_contrib";
  return "pf";
}

export async function calcularTributosDaNota(
  supabase: Sb,
  empresa: Rec,
  nota: Rec,
  itens: Rec[],
  cliente: Rec | null,
): Promise<TaxComputeResult> {
  if (!itens.length) {
    throw new Error("Nota sem itens — cálculo tributário abortado.");
  }
  if (!cliente) {
    throw new Error("Destinatário ausente — impossível calcular tributos.");
  }

  const [{ data: regrasRaw }, { data: ufsRaw }] = await Promise.all([
    supabase.from("regras_tributarias").select("*").eq("ativo", true),
    supabase.from("uf_aliquotas").select("*").eq("ativo", true),
  ]);
  const regras = (regrasRaw ?? []) as RegraTributaria[];
  const uf_aliquotas = (ufsRaw ?? []) as UfAliquota[];

  if (!regras.length) {
    throw new Error("Nenhuma regra tributária cadastrada. Configure em Fiscal → Regras Tributárias.");
  }

  // origem/cest por variante → product
  const variantIds = Array.from(new Set(
    itens.map((i) => i.variante_id).filter(Boolean),
  )) as string[];
  const prodMeta = new Map<string, { origem: number; ncm: string | null; cest: string | null }>();
  if (variantIds.length) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, product_id")
      .in("id", variantIds);
    const productIds = Array.from(new Set(
      (variants ?? []).map((v: Rec) => v.product_id).filter(Boolean),
    )) as string[];
    const prodById = new Map<string, Rec>();
    if (productIds.length) {
      const { data: prods } = await supabase
        .from("products").select("id, ncm, cest, origem")
        .in("id", productIds);
      (prods ?? []).forEach((p: Rec) => prodById.set(p.id, p));
    }
    (variants ?? []).forEach((v: Rec) => {
      const p = prodById.get(v.product_id) ?? {};
      prodMeta.set(v.id, {
        origem: Number(p.origem ?? 0),
        ncm: (p.ncm as string | null) ?? null,
        cest: (p.cest as string | null) ?? null,
      });
    });
  }

  const ctx: TaxContext = {
    emitente: { uf: String(empresa.uf ?? ""), regime: inferRegime(empresa) },
    destinatario: {
      uf: String(cliente.uf ?? ""),
      tipo_cliente: inferTipoCliente(cliente),
      consumidor_final: Boolean(cliente.consumidor_final ?? true),
    },
    operacao: (nota.tipo_operacao as TipoOperacao) ?? "venda",
    finalidade: (nota.finalidade_tributaria as Finalidade) ?? "revenda",
    regras, uf_aliquotas,
  };

  const inputs: ItemInput[] = itens.map((i) => {
    const meta = i.variante_id ? prodMeta.get(i.variante_id) : undefined;
    const qtd = Number(i.quantidade_saida ?? i.quantidade ?? 0);
    const vu = Number(i.valor_unitario ?? 0);
    return {
      descricao: String(i.descricao ?? ""),
      ncm: String(i.ncm ?? meta?.ncm ?? "").replace(/\D/g, ""),
      cest: (meta?.cest ?? null),
      quantidade: qtd,
      valor_unitario: vu,
      desconto: 0, frete: 0, outras: 0, seguro: 0,
    };
  });

  const { itens: resultados, totais } = calcularNota(ctx, inputs);

  const semRegra: string[] = [];
  resultados.forEach((r, idx) => {
    if (!r.regra_aplicada) {
      semRegra.push(`Item ${idx + 1} (${r.descricao || "sem descrição"}) NCM ${r.ncm || "?"}`);
    }
  });
  if (semRegra.length) {
    throw new Error(
      "Emissão bloqueada — nenhuma regra tributária compatível para:\n" +
      semRegra.map((s) => `  • ${s}`).join("\n") +
      "\n\nCadastre a regra em Fiscal → Regras Tributárias antes de emitir.",
    );
  }

  const itensCalculados = itens.map((raw, idx) => {
    const r = resultados[idx];
    const meta = raw.variante_id ? prodMeta.get(raw.variante_id) : undefined;
    return {
      ...raw,
      ncm: r.ncm || raw.ncm,
      cfop: r.cfop,
      origem: meta?.origem ?? 0,
      cst_icms: r.cst_icms,
      csosn: r.csosn,
      base_icms: r.base_icms,
      aliq_icms: r.aliq_icms,
      valor_icms: r.valor_icms,
      base_icms_st: r.base_icms_st,
      aliq_icms_st: r.aliq_icms_st,
      valor_icms_st: r.valor_icms_st,
      valor_fcp: r.valor_fcp,
      valor_fcp_st: r.valor_fcp_st,
      valor_difal: r.valor_difal,
      cst_ipi: r.cst_ipi,
      base_ipi: r.base_ipi,
      aliq_ipi: r.aliq_ipi,
      valor_ipi: r.valor_ipi,
      cst_pis: r.cst_pis,
      base_pis: r.base_pis,
      aliq_pis: r.aliq_pis,
      valor_pis: r.valor_pis,
      cst_cofins: r.cst_cofins,
      base_cofins: r.base_cofins,
      aliq_cofins: r.aliq_cofins,
      valor_cofins: r.valor_cofins,
      valor_total_calc: r.valor_total,
    };
  });

  return { itensCalculados, totais, avisos: [] };
}
