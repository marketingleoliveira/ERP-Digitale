/**
 * Server functions do módulo de Pedidos.
 * Um pedido confirmado gera automaticamente N OPs (uma por item).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PedidoItemInput = {
  product_id?: string | null;
  variante_id?: string | null;
  cor_id?: string | null;
  estampa_id?: string | null;
  descricao?: string | null;
  quantidade: number;
  unidade?: string;
  valor_unitario: number;
};

type PedidoInput = {
  numero: string;
  cliente_id?: string | null;
  vendedor_id?: string | null;
  prazo_entrega?: string | null;
  condicao_pagamento?: string | null;
  observacao?: string | null;
  itens: PedidoItemInput[];
};

export const criarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: PedidoInput) => {
    if (!i.numero) throw new Error("Número do pedido obrigatório.");
    if (!Array.isArray(i.itens) || i.itens.length === 0) throw new Error("Adicione ao menos um item.");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.itens.reduce((s, it) => s + Number(it.quantidade) * Number(it.valor_unitario), 0);
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        numero: data.numero,
        cliente_id: data.cliente_id ?? null,
        vendedor_id: data.vendedor_id ?? null,
        prazo_entrega: data.prazo_entrega ?? null,
        condicao_pagamento: data.condicao_pagamento ?? null,
        observacao: data.observacao ?? null,
        valor_total: total,
        created_by: userId,
      } as never)
      .select("id").single();
    if (error) throw new Error(error.message);
    const pid = (pedido as { id: string }).id;

    const itens = data.itens.map(it => ({
      pedido_id: pid,
      product_id: it.product_id ?? null,
      variante_id: it.variante_id ?? null,
      cor_id: it.cor_id ?? null,
      estampa_id: it.estampa_id ?? null,
      descricao: it.descricao ?? null,
      quantidade: it.quantidade,
      unidade: it.unidade ?? "UN",
      valor_unitario: it.valor_unitario,
    }));
    const { error: eErr } = await supabase.from("pedido_itens").insert(itens as never);
    if (eErr) throw new Error(eErr.message);
    return { ok: true as const, pedido_id: pid };
  });

/** Confirma o pedido e cria 1 OP por item (regra: 1 pedido → N OPs). */
export const confirmarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { pedidoId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: itens, error } = await supabase
      .from("pedido_itens").select("*").eq("pedido_id", data.pedidoId);
    if (error) throw new Error(error.message);
    if (!itens || itens.length === 0) throw new Error("Pedido sem itens.");

    const opsIds: string[] = [];
    for (const it of itens as Record<string, unknown>[]) {
      const { data: numRow } = await supabase.rpc("proximo_numero_op" as never);
      const numero = Number(numRow ?? 0);
      const { data: op, error: opErr } = await supabase
        .from("ordens_producao")
        .insert({
          numero,
          pedido_id: data.pedidoId,
          status: "planejada",
          created_by: userId,
        } as never)
        .select("id").single();
      if (opErr) throw new Error(opErr.message);
      const opId = (op as { id: string }).id;
      opsIds.push(opId);

      await supabase.from("op_itens").insert({
        op_id: opId,
        pedido_item_id: it.id,
        product_id: it.product_id ?? null,
        variante_id: it.variante_id ?? null,
        cor_id: it.cor_id ?? null,
        estampa_id: it.estampa_id ?? null,
        descricao: it.descricao ?? null,
        quantidade_planejada: it.quantidade,
        unidade: it.unidade ?? "KG",
      } as never);

      await supabase.from("op_eventos").insert({
        op_id: opId, tipo: "criada_a_partir_de_pedido",
        para_status: "planejada",
        payload: { pedido_id: data.pedidoId, pedido_item_id: it.id },
        user_id: userId,
      } as never);
    }

    await supabase.from("pedidos").update({ status: "confirmado" } as never).eq("id", data.pedidoId);
    return { ok: true as const, ops: opsIds };
  });
