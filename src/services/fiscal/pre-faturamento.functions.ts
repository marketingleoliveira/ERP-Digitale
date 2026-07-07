/**
 * Motor de Pré-Faturamento.
 * - `getPreFaturamento(opId)`: monta payload consolidado a partir da OP (cliente,
 *   pedido, itens, valores, transportadora). Nunca solicita dados que já existem.
 * - `gerarPreFaturamento(opId)`: cria (ou atualiza) a NF-e em `rascunho` vinculada
 *   à OP, com itens copiados de op_itens/pedido_itens, e marca op_faturamento como
 *   `pre_faturado`. Requer OP em status `pronta_faturamento`.
 * O módulo Fiscal apenas consome esta NF-e (assinar/transmitir/DANFE).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type OpItemRow = {
  id: string; product_id: string | null; variante_id: string | null;
  cor_id: string | null; estampa_id: string | null;
  descricao: string | null; unidade: string;
  quantidade_aprovada: number; quantidade_produzida: number; quantidade_planejada: number;
  pedido_item_id: string | null;
};

type PedidoItemRow = {
  id: string; valor_unitario: number; quantidade: number;
  product_id: string | null; variante_id: string | null; descricao: string | null;
};

export const getPreFaturamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { opId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: op, error: opErr } = await supabase
      .from("ordens_producao")
      .select("id, numero, status, pedido_id, observacao")
      .eq("id", data.opId).maybeSingle();
    if (opErr) throw new Error(opErr.message);
    if (!op) throw new Error("OP não encontrada.");

    const { data: itens } = await supabase
      .from("op_itens").select("*").eq("op_id", data.opId);
    const { data: pedido } = op.pedido_id
      ? await supabase.from("pedidos")
          .select("id, numero, cliente_id, condicao_pagamento, observacao")
          .eq("id", op.pedido_id).maybeSingle()
      : { data: null };
    const cliente = pedido?.cliente_id
      ? (await supabase.from("customers").select("id, nome_fantasia, razao_social, cpf_cnpj, transportadora_id")
          .eq("id", pedido.cliente_id).maybeSingle()).data
      : null;
    const pedidoItens = pedido?.id
      ? (await supabase.from("pedido_itens").select("*").eq("pedido_id", pedido.id)).data ?? []
      : [];

    return { op, pedido, cliente, itens: (itens ?? []) as OpItemRow[], pedidoItens: pedidoItens as PedidoItemRow[] };
  });

export const gerarPreFaturamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { opId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: op, error: opErr } = await supabase
      .from("ordens_producao").select("id, numero, status, pedido_id")
      .eq("id", data.opId).maybeSingle();
    if (opErr) throw new Error(opErr.message);
    if (!op) throw new Error("OP não encontrada.");
    if (op.status !== "pronta_faturamento" && op.status !== "pronta_estoque") {
      throw new Error(`OP em status "${op.status}" — deve estar pronta para faturamento.`);
    }

    if (op.status === "pronta_estoque") {
      await supabase.rpc("op_transicionar" as never,
        { _op_id: data.opId, _novo_status: "pronta_faturamento" } as never);
    }

    // Já existe NF-e rascunho vinculada?
    const { data: existente } = await supabase
      .from("notas_fiscais").select("id, status_sefaz")
      .eq("op_id", data.opId).eq("status", "rascunho").maybeSingle();

    let cliente_id: string | null = null;
    let transportadora_id: string | null = null;
    if (op.pedido_id) {
      const { data: ped } = await supabase.from("pedidos")
        .select("cliente_id").eq("id", op.pedido_id).maybeSingle();
      cliente_id = (ped as { cliente_id: string | null } | null)?.cliente_id ?? null;
      if (cliente_id) {
        const { data: cli } = await supabase.from("customers")
          .select("transportadora_id").eq("id", cliente_id).maybeSingle();
        transportadora_id = (cli as { transportadora_id: string | null } | null)?.transportadora_id ?? null;
      }
    }

    const { data: itens } = await supabase
      .from("op_itens").select("*").eq("op_id", data.opId);
    const opItens = (itens ?? []) as OpItemRow[];

    // Preços via pedido_itens (por pedido_item_id)
    const pedidoItemIds = opItens.map((i) => i.pedido_item_id).filter(Boolean) as string[];
    const precos = new Map<string, PedidoItemRow>();
    if (pedidoItemIds.length) {
      const { data: pi } = await supabase.from("pedido_itens")
        .select("*").in("id", pedidoItemIds);
      for (const r of (pi ?? []) as PedidoItemRow[]) precos.set(r.id, r);
    }

    const nfItens = opItens.map((it) => {
      const qtd = Number(it.quantidade_aprovada || it.quantidade_produzida || it.quantidade_planejada || 0);
      const vu = it.pedido_item_id ? Number(precos.get(it.pedido_item_id)?.valor_unitario ?? 0) : 0;
      return {
        descricao: it.descricao ?? "Produto",
        quantidade: qtd, valor_unitario: vu, valor_total: Number((qtd * vu).toFixed(2)),
        unidade: it.unidade, cor_id: it.cor_id, estampa_id: it.estampa_id, variante_id: it.variante_id,
      };
    });
    const valor_total = Number(nfItens.reduce((s, r) => s + r.valor_total, 0).toFixed(2));

    let nfId: string;
    if (existente) {
      nfId = (existente as { id: string }).id;
      await supabase.from("notas_fiscais").update({
        cliente_id, transportadora_id, valor_total,
      } as never).eq("id", nfId);
      await supabase.from("notas_fiscais_itens").delete().eq("nota_fiscal_id", nfId);
    } else {
      const { data: created, error: cErr } = await supabase.from("notas_fiscais").insert({
        tipo: "saida", numero: `PRE-${op.numero}`, serie: "1",
        cliente_id, transportadora_id, op_id: data.opId,
        status: "rascunho", status_sefaz: "rascunho",
        finalidade: "Normal", modelo: "55",
        valor_total,
      } as never).select("id").single();
      if (cErr) throw new Error(cErr.message);
      nfId = (created as { id: string }).id;
    }

    if (nfItens.length) {
      await supabase.from("notas_fiscais_itens").insert(
        nfItens.map((i) => ({ ...i, nota_fiscal_id: nfId })) as never
      );
    }

    // Upsert op_faturamento
    const { data: fatExist } = await supabase.from("op_faturamento")
      .select("id").eq("op_id", data.opId).maybeSingle();
    const qtdFat = opItens.reduce((s, i) =>
      s + Number(i.quantidade_aprovada || i.quantidade_produzida || 0), 0);
    if (fatExist) {
      await supabase.from("op_faturamento").update({
        nota_fiscal_id: nfId, quantidade_faturada: qtdFat, status: "pre_faturado",
      } as never).eq("id", (fatExist as { id: string }).id);
    } else {
      await supabase.from("op_faturamento").insert({
        op_id: data.opId, nota_fiscal_id: nfId,
        quantidade_faturada: qtdFat, status: "pre_faturado",
      } as never);
    }

    return { ok: true as const, nota_fiscal_id: nfId };
  });
