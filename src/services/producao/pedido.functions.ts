/**
 * Server functions do módulo de Pedidos de Venda.
 *
 * Fluxo: rascunho → aguardando_aprovacao → aprovado → confirmado
 * (dispara N OPs) → em_producao / parcialmente_produzido → pronto_faturamento
 * → faturado → expedido → entregue. `cancelado` bloqueia edições.
 *
 * Nenhuma tabela nova: usa `pedidos`, `pedido_itens`, `ordens_producao`,
 * `op_itens`, `op_eventos`, `notas_fiscais`, `contas_receber`,
 * `op_expedicoes`, `audit_logs`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PedidoStatus =
  | "rascunho" | "aguardando_aprovacao" | "aprovado" | "confirmado"
  | "em_producao" | "parcialmente_produzido" | "pronto_faturamento"
  | "faturado" | "expedido" | "entregue" | "cancelado";

const STATUS_BLOQUEIA_EDICAO_ITENS: PedidoStatus[] = [
  "em_producao", "parcialmente_produzido", "pronto_faturamento",
  "faturado", "expedido", "entregue", "cancelado",
];

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

async function logAudit(
  supabase: { from: (t: string) => { insert: (v: never) => Promise<unknown> } },
  entidadeId: string, acao: string, payload: Record<string, unknown>,
  userId: string, de?: string, para?: string,
) {
  await supabase.from("audit_logs").insert({
    entidade: "pedido", entidade_id: entidadeId, acao,
    de_status: de ?? null, para_status: para ?? null,
    payload, user_id: userId,
  } as never);
}

// ─────────────────────────────────────────────────────────────
// LISTAGEM
// ─────────────────────────────────────────────────────────────
export const listarPedidos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { status?: string; search?: string } = {}) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("pedidos").select(
      "id, numero, data_pedido, prazo_entrega, valor_total, status, cliente_id, vendedor_id",
    ).order("data_pedido", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("numero", `%${data.search}%`);
    const { data: pedidos, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (pedidos ?? []) as Array<Record<string, unknown>>;
    if (rows.length === 0) return [];

    const clienteIds = [...new Set(rows.map(r => r.cliente_id).filter(Boolean))] as string[];
    const vendedorIds = [...new Set(rows.map(r => r.vendedor_id).filter(Boolean))] as string[];
    const pedidoIds = rows.map(r => r.id as string);

    const [clientesRes, vendedoresRes, opsRes] = await Promise.all([
      clienteIds.length
        ? supabase.from("customers").select("id, nome").in("id", clienteIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      vendedorIds.length
        ? supabase.from("sales_reps").select("id, nome").in("id", vendedorIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      supabase.from("ordens_producao")
        .select("id, pedido_id, status")
        .in("pedido_id", pedidoIds),
    ]);

    const clientes = new Map(((clientesRes.data ?? []) as {id:string;nome:string}[]).map(c => [c.id, c.nome]));
    const vendedores = new Map(((vendedoresRes.data ?? []) as {id:string;nome:string}[]).map(v => [v.id, v.nome]));
    const opsPorPedido = new Map<string, { total: number; concluidas: number }>();
    for (const op of (opsRes.data ?? []) as { pedido_id: string; status: string }[]) {
      const cur = opsPorPedido.get(op.pedido_id) ?? { total: 0, concluidas: 0 };
      cur.total += 1;
      if (["encerrada","expedida","faturada","pronta_faturamento","pronta_estoque"].includes(op.status))
        cur.concluidas += 1;
      opsPorPedido.set(op.pedido_id, cur);
    }

    return rows.map(r => ({
      id: r.id as string,
      numero: r.numero as string,
      data_pedido: r.data_pedido as string,
      prazo_entrega: r.prazo_entrega as string | null,
      valor_total: Number(r.valor_total ?? 0),
      status: r.status as PedidoStatus,
      cliente: clientes.get(r.cliente_id as string) ?? "—",
      vendedor: vendedores.get(r.vendedor_id as string) ?? "—",
      producao: opsPorPedido.get(r.id as string) ?? { total: 0, concluidas: 0 },
    }));
  });

// ─────────────────────────────────────────────────────────────
// DETALHE COMPLETO
// ─────────────────────────────────────────────────────────────
export const getPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [pedRes, itensRes, opsRes, auditRes] = await Promise.all([
      supabase.from("pedidos").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("pedido_itens").select("*").eq("pedido_id", data.id),
      supabase.from("ordens_producao").select("id, numero, status, data_abertura, data_prevista")
        .eq("pedido_id", data.id).order("numero", { ascending: true }),
      supabase.from("audit_logs").select("*").eq("entidade","pedido").eq("entidade_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (pedRes.error) throw new Error(pedRes.error.message);
    const pedido = pedRes.data as Record<string, unknown> | null;
    if (!pedido) throw new Error("Pedido não encontrado.");

    const opIds = ((opsRes.data ?? []) as { id: string }[]).map(o => o.id);
    const [notasRes, expedRes, cliRes, venRes] = await Promise.all([
      opIds.length
        ? supabase.from("notas_fiscais")
            .select("id, numero, serie, status, status_sefaz, valor_total, data_emissao, op_id")
            .in("op_id", opIds)
        : Promise.resolve({ data: [] }),
      opIds.length
        ? supabase.from("op_expedicoes").select("*").in("op_id", opIds)
        : Promise.resolve({ data: [] }),
      pedido.cliente_id
        ? supabase.from("customers").select("id, nome, email, telefone, endereco, cidade, uf")
            .eq("id", pedido.cliente_id as string).maybeSingle()
        : Promise.resolve({ data: null }),
      pedido.vendedor_id
        ? supabase.from("sales_reps").select("id, nome, email").eq("id", pedido.vendedor_id as string).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const nfIds = ((notasRes.data ?? []) as { id: string }[]).map(n => n.id);
    const contasRes = nfIds.length
      ? await supabase.from("contas_receber").select("*").in("nota_fiscal_id", nfIds)
      : { data: [] };

    return {
      pedido,
      cliente: cliRes.data,
      vendedor: venRes.data,
      itens: itensRes.data ?? [],
      ops: opsRes.data ?? [],
      notas: notasRes.data ?? [],
      contas: contasRes.data ?? [],
      expedicoes: expedRes.data ?? [],
      historico: auditRes.data ?? [],
    };
  });

// ─────────────────────────────────────────────────────────────
// CRIAR
// ─────────────────────────────────────────────────────────────
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
        status: "rascunho",
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
      valor_total: Number(it.quantidade) * Number(it.valor_unitario),
    }));
    const { error: eErr } = await supabase.from("pedido_itens").insert(itens as never);
    if (eErr) throw new Error(eErr.message);
    await logAudit(supabase, pid, "criado", { itens: itens.length, valor_total: total }, userId, undefined, "rascunho");
    return { ok: true as const, pedido_id: pid };
  });

// ─────────────────────────────────────────────────────────────
// TRANSIÇÃO DE STATUS SIMPLES (rascunho ↔ aguardando ↔ aprovado ↔ cancelado)
// ─────────────────────────────────────────────────────────────
export const atualizarStatusPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: PedidoStatus; motivo?: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cur } = await supabase.from("pedidos").select("status").eq("id", data.id).maybeSingle();
    const de = (cur as { status?: string } | null)?.status;

    if (data.status === "cancelado") {
      const { data: ops } = await supabase.from("ordens_producao")
        .select("status").eq("pedido_id", data.id);
      const bloqueia = ((ops ?? []) as {status:string}[])
        .some(o => !["planejada","cancelada"].includes(o.status));
      if (bloqueia) throw new Error("Existem OPs em produção — cancelamento bloqueado.");
    }

    const { error } = await supabase.from("pedidos")
      .update({ status: data.status } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(supabase, data.id, "status_change",
      { motivo: data.motivo ?? null }, userId, de, data.status);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────
// EDITAR CABEÇALHO / ITENS (bloqueado após produção)
// ─────────────────────────────────────────────────────────────
export const atualizarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    id: string;
    patch: Partial<Omit<PedidoInput, "itens">>;
    itens?: PedidoItemInput[];
    forcarAuditoria?: boolean;
  }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cur } = await supabase.from("pedidos").select("status").eq("id", data.id).maybeSingle();
    const status = (cur as { status?: PedidoStatus } | null)?.status;
    if (status && STATUS_BLOQUEIA_EDICAO_ITENS.includes(status) && !data.forcarAuditoria) {
      throw new Error(`Edição bloqueada — pedido em status ${status}. Use força auditoria (perfil gerente).`);
    }
    if (Object.keys(data.patch).length) {
      const { error } = await supabase.from("pedidos").update(data.patch as never).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (data.itens) {
      await supabase.from("pedido_itens").delete().eq("pedido_id", data.id);
      const total = data.itens.reduce((s, it) => s + Number(it.quantidade) * Number(it.valor_unitario), 0);
      const rows = data.itens.map(it => ({
        pedido_id: data.id,
        product_id: it.product_id ?? null,
        variante_id: it.variante_id ?? null,
        cor_id: it.cor_id ?? null,
        estampa_id: it.estampa_id ?? null,
        descricao: it.descricao ?? null,
        quantidade: it.quantidade,
        unidade: it.unidade ?? "UN",
        valor_unitario: it.valor_unitario,
        valor_total: Number(it.quantidade) * Number(it.valor_unitario),
      }));
      const { error: eErr } = await supabase.from("pedido_itens").insert(rows as never);
      if (eErr) throw new Error(eErr.message);
      await supabase.from("pedidos").update({ valor_total: total } as never).eq("id", data.id);
    }
    await logAudit(supabase, data.id, data.forcarAuditoria ? "edicao_forcada" : "edicao",
      { patch: data.patch, itens_alterados: !!data.itens }, userId);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────
// GERAR OPs (idempotente: cria só para pedido_itens sem OP)
// ─────────────────────────────────────────────────────────────
export const gerarOpsPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { pedidoId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [itensRes, opItensRes] = await Promise.all([
      supabase.from("pedido_itens").select("*").eq("pedido_id", data.pedidoId),
      supabase.from("op_itens")
        .select("pedido_item_id, ordens_producao!inner(pedido_id)")
        .eq("ordens_producao.pedido_id", data.pedidoId),
    ]);
    if (itensRes.error) throw new Error(itensRes.error.message);
    const itens = (itensRes.error ? [] : itensRes.data ?? []) as Array<Record<string, unknown>>;
    if (itens.length === 0) throw new Error("Pedido sem itens.");
    const jaGerados = new Set(
      ((opItensRes.data ?? []) as { pedido_item_id: string | null }[])
        .map(r => r.pedido_item_id).filter(Boolean) as string[],
    );

    const opsIds: string[] = [];
    const faltas: Array<{ item: string; motivo: string }> = [];
    for (const it of itens) {
      if (jaGerados.has(it.id as string)) continue;

      // Validação BOM/roteiro (aviso, não bloqueia)
      if (it.product_id) {
        const { data: prod } = await supabase.from("products")
          .select("article_id").eq("id", it.product_id as string).maybeSingle();
        const artId = (prod as { article_id?: string } | null)?.article_id;
        if (!artId) {
          faltas.push({ item: (it.descricao as string) ?? (it.id as string), motivo: "produto sem artigo vinculado" });
        } else {
          const { count } = await supabase.from("article_bom")
            .select("id", { count: "exact", head: true }).eq("article_id", artId);
          if (!count) faltas.push({ item: (it.descricao as string) ?? artId, motivo: "artigo sem BOM cadastrada" });
        }
      }

      const { data: numRow } = await supabase.rpc("proximo_numero_op" as never);
      const numero = Number(numRow ?? 0);
      const { data: op, error: opErr } = await supabase.from("ordens_producao")
        .insert({ numero, pedido_id: data.pedidoId, status: "planejada", created_by: userId } as never)
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
        unidade: (it.unidade as string) ?? "KG",
      } as never);
      await supabase.from("op_eventos").insert({
        op_id: opId, tipo: "criada_a_partir_de_pedido", para_status: "planejada",
        payload: { pedido_id: data.pedidoId, pedido_item_id: it.id }, user_id: userId,
      } as never);
    }
    if (opsIds.length) {
      await supabase.from("pedidos").update({ status: "confirmado" } as never).eq("id", data.pedidoId);
      await logAudit(supabase, data.pedidoId, "ops_geradas",
        { ops: opsIds, faltas }, userId, undefined, "confirmado");
    }
    return { ok: true as const, ops: opsIds, faltas };
  });

/** Retro-compatibilidade: `confirmarPedido` continua a fazer o mesmo que `gerarOpsPedido`. */
export const confirmarPedido = gerarOpsPedido;

// ─────────────────────────────────────────────────────────────
// STATUS AGREGADO — recomputa a partir das OPs / NF / expedições
// ─────────────────────────────────────────────────────────────
export function derivarStatusPedido(input: {
  atual: PedidoStatus | string;
  ops: { status: string }[];
  notas: { status_sefaz?: string | null }[];
  expedicoes: { status?: string | null }[];
}): PedidoStatus {
  if (input.atual === "cancelado" || input.atual === "rascunho"
      || input.atual === "aguardando_aprovacao" || input.atual === "aprovado") {
    return input.atual as PedidoStatus;
  }
  if (input.ops.length === 0) return "confirmado";

  const opStatuses = input.ops.map(o => o.status);
  const finalizada = (s: string) =>
    ["encerrada","expedida","faturada","pronta_faturamento","pronta_estoque"].includes(s);
  const emProducao = (s: string) =>
    ["em_producao","parcial","aguardando_qualidade","aprovada","reprovada"].includes(s);

  const todasEntregues = input.expedicoes.length > 0
    && input.expedicoes.every(e => e.status === "entregue");
  if (todasEntregues) return "entregue";

  const algumaExpSaiu = input.expedicoes.some(e => e.status === "saiu" || e.status === "entregue");
  if (algumaExpSaiu) return "expedido";

  const todasFaturadas = input.notas.length >= input.ops.length
    && input.notas.every(n => n.status_sefaz === "autorizada");
  if (todasFaturadas && input.notas.length > 0) return "faturado";

  const todasProntas = opStatuses.every(finalizada);
  if (todasProntas) return "pronto_faturamento";

  const algumasProntas = opStatuses.some(finalizada);
  const algumasEmAndamento = opStatuses.some(emProducao);
  if (algumasProntas && !opStatuses.every(finalizada)) return "parcialmente_produzido";
  if (algumasEmAndamento) return "em_producao";

  return "confirmado";
}
