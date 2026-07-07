// Motor Tributário — cálculo puro.
// Recebe snapshot (regras + UFs + contexto) e devolve resultado determinístico.
// Nenhuma constante fiscal fica no código: tudo vem das tabelas.

import type {
  ItemInput, ItemResult, RegraTributaria, TaxContext, TotaisNota, UfAliquota,
} from "./types";

export type { TaxContext, ItemInput, ItemResult, TotaisNota, RegraTributaria, UfAliquota };

const round = (v: number, d = 2): number => {
  const f = Math.pow(10, d);
  return Math.round((v + Number.EPSILON) * f) / f;
};

/** Retorna a regra de maior prioridade compatível com o contexto/item. */
export function resolverRegra(
  ctx: TaxContext,
  item: ItemInput,
): RegraTributaria | null {
  const candidatas = ctx.regras
    .filter((r) => r.ativo)
    .filter((r) => match(r.uf_origem, ctx.emitente.uf))
    .filter((r) => match(r.uf_destino, ctx.destinatario.uf))
    .filter((r) => match(r.regime_tributario_emitente, ctx.emitente.regime))
    .filter((r) => match(r.tipo_cliente, ctx.destinatario.tipo_cliente))
    .filter((r) => match(r.tipo_operacao, ctx.operacao))
    .filter((r) => match(r.finalidade, ctx.finalidade))
    .filter((r) => !r.ncm_prefix || item.ncm.startsWith(r.ncm_prefix))
    .filter((r) => !r.cest || r.cest === item.cest);

  candidatas.sort((a, b) => {
    // Mais específica primeiro (mais campos preenchidos), depois prioridade
    const espA = especificidade(a);
    const espB = especificidade(b);
    if (espA !== espB) return espB - espA;
    return b.prioridade - a.prioridade;
  });

  return candidatas[0] ?? null;
}

function match<T extends string>(regra: T | null, ctxValor: T): boolean {
  return regra === null || regra === ctxValor;
}

function especificidade(r: RegraTributaria): number {
  const camposEscopo: Array<keyof RegraTributaria> = [
    "uf_origem", "uf_destino", "regime_tributario_emitente",
    "tipo_cliente", "tipo_operacao", "ncm_prefix", "cest", "finalidade",
  ];
  return camposEscopo.reduce((acc, k) => acc + (r[k] != null ? 1 : 0), 0);
}

function ufAliq(ctx: TaxContext, sigla: string): UfAliquota | undefined {
  return ctx.uf_aliquotas.find((u) => u.sigla === sigla);
}

export function calcularItem(ctx: TaxContext, item: ItemInput): ItemResult {
  const avisos: string[] = [];
  const regra = resolverRegra(ctx, item);
  if (!regra) avisos.push("Nenhuma regra tributária compatível encontrada.");

  const valor_produtos = round(item.quantidade * item.valor_unitario);
  const base_bruta = valor_produtos - item.desconto + item.frete + item.outras + item.seguro;

  // ICMS
  let cfop = regra?.cfop ?? "";
  const cst_icms = regra?.cst_icms ?? null;
  const csosn = regra?.csosn ?? null;
  let aliq_icms = regra?.aliq_icms ?? 0;
  let valor_icms = 0;
  let base_icms = 0;
  let valor_fcp = 0;
  let valor_difal = 0;

  const interestadual = ctx.emitente.uf !== ctx.destinatario.uf;
  const destUf = ufAliq(ctx, ctx.destinatario.uf);

  // Se a regra não fixa alíquota e é venda normal, deriva da tabela uf_aliquotas
  if (regra && aliq_icms === 0 && !regra.calcula_st) {
    aliq_icms = interestadual
      ? (destUf?.icms_interestadual_pct ?? 0)
      : (destUf?.icms_interno_pct ?? 0);
  }

  if (regra && ctx.emitente.regime !== "simples" && cst_icms) {
    const reducao = regra.red_base_icms_pct || 0;
    base_icms = round(base_bruta * (1 - reducao / 100));
    valor_icms = round(base_icms * aliq_icms / 100);
    if (regra.aliq_fcp > 0) {
      valor_fcp = round(base_icms * regra.aliq_fcp / 100);
    } else if (destUf?.fundo_pobreza_pct) {
      valor_fcp = round(base_icms * destUf.fundo_pobreza_pct / 100);
    }
  }

  // DIFAL — venda interestadual para consumidor final não contribuinte
  if (
    regra?.calcula_difal &&
    interestadual &&
    ctx.destinatario.consumidor_final &&
    ctx.destinatario.tipo_cliente !== "pj_contribuinte" &&
    destUf
  ) {
    const aliqInter = destUf.icms_interestadual_pct;
    const aliqInterna = destUf.icms_interno_pct;
    valor_difal = round(base_bruta * (aliqInterna - aliqInter) / 100);
  }

  // ICMS ST
  let base_icms_st = 0;
  let aliq_icms_st = 0;
  let valor_icms_st = 0;
  let valor_fcp_st = 0;
  if (regra?.calcula_st) {
    const mva = regra.mva_pct / 100;
    base_icms_st = round(base_bruta * (1 + mva));
    aliq_icms_st = regra.aliq_icms_st || destUf?.icms_st_pct || 0;
    const icmsProprio = round(base_bruta * aliq_icms / 100);
    valor_icms_st = round(base_icms_st * aliq_icms_st / 100 - icmsProprio);
    if (regra.aliq_fcp_st > 0) {
      valor_fcp_st = round(base_icms_st * regra.aliq_fcp_st / 100);
    }
  }

  // IPI / PIS / COFINS
  const cst_ipi = regra?.cst_ipi ?? null;
  const aliq_ipi = regra?.aliq_ipi ?? 0;
  const base_ipi = valor_produtos;
  const valor_ipi = round(base_ipi * aliq_ipi / 100);

  const cst_pis = regra?.cst_pis ?? null;
  const aliq_pis = regra?.aliq_pis ?? 0;
  const base_pis = valor_produtos;
  const valor_pis = round(base_pis * aliq_pis / 100);

  const cst_cofins = regra?.cst_cofins ?? null;
  const aliq_cofins = regra?.aliq_cofins ?? 0;
  const base_cofins = valor_produtos;
  const valor_cofins = round(base_cofins * aliq_cofins / 100);

  const valor_total = round(
    valor_produtos - item.desconto + item.frete + item.outras + item.seguro
    + valor_ipi + valor_icms_st + valor_fcp_st,
  );

  return {
    descricao: item.descricao,
    ncm: item.ncm,
    cfop,
    cst_icms, csosn,
    valor_produtos,
    base_icms, aliq_icms, valor_icms,
    base_icms_st, aliq_icms_st, valor_icms_st,
    valor_fcp, valor_fcp_st, valor_difal,
    base_ipi, aliq_ipi, valor_ipi, cst_ipi,
    base_pis, aliq_pis, valor_pis, cst_pis,
    base_cofins, aliq_cofins, valor_cofins, cst_cofins,
    valor_total,
    regra_aplicada: regra?.nome ?? null,
    avisos,
  };
}

export function calcularNota(ctx: TaxContext, itens: ItemInput[]): {
  itens: ItemResult[];
  totais: TotaisNota;
} {
  const resultados = itens.map((i) => calcularItem(ctx, i));
  const totais: TotaisNota = {
    valor_produtos: 0, valor_desconto: 0, valor_frete: 0, valor_seguro: 0, valor_outras: 0,
    base_icms: 0, valor_icms: 0, base_icms_st: 0, valor_icms_st: 0,
    valor_ipi: 0, valor_pis: 0, valor_cofins: 0,
    valor_fcp: 0, valor_fcp_st: 0, valor_difal: 0, valor_total: 0,
  };
  itens.forEach((i, idx) => {
    const r = resultados[idx];
    totais.valor_produtos += r.valor_produtos;
    totais.valor_desconto += i.desconto;
    totais.valor_frete += i.frete;
    totais.valor_seguro += i.seguro;
    totais.valor_outras += i.outras;
    totais.base_icms += r.base_icms;
    totais.valor_icms += r.valor_icms;
    totais.base_icms_st += r.base_icms_st;
    totais.valor_icms_st += r.valor_icms_st;
    totais.valor_ipi += r.valor_ipi;
    totais.valor_pis += r.valor_pis;
    totais.valor_cofins += r.valor_cofins;
    totais.valor_fcp += r.valor_fcp;
    totais.valor_fcp_st += r.valor_fcp_st;
    totais.valor_difal += r.valor_difal;
    totais.valor_total += r.valor_total;
  });
  Object.keys(totais).forEach((k) => {
    (totais as Record<string, number>)[k] = round((totais as Record<string, number>)[k]);
  });
  return { itens: resultados, totais };
}
