/**
 * Rastreabilidade — dado um documento (tipo+id), monta a árvore de vínculos
 * em ambas as direções (Pedido ↔ OP ↔ NF ↔ Recebimento ↔ Contas ↔ Romaneio ↔ Lotes ↔ Movimentos).
 */
import { supabase } from "@/integrations/supabase/client";

export type NodeTipo =
  | "pedido" | "op" | "nota_fiscal" | "cliente" | "fornecedor"
  | "pedido_compra" | "recebimento" | "conta_pagar" | "conta_receber"
  | "lote" | "movimento_estoque" | "movimento_financeiro"
  | "separacao" | "romaneio";

export type RastroNode = {
  tipo: NodeTipo;
  id: string;
  label: string;
  descricao?: string;
  route?: { to: string; params?: Record<string, string> };
};

const tipoLabel: Record<NodeTipo, string> = {
  pedido: "Pedido de Venda",
  op: "Ordem de Produção",
  nota_fiscal: "Nota Fiscal",
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  pedido_compra: "Pedido de Compra",
  recebimento: "Recebimento",
  conta_pagar: "Conta a Pagar",
  conta_receber: "Conta a Receber",
  lote: "Lote",
  movimento_estoque: "Movimento Estoque",
  movimento_financeiro: "Movimento Financeiro",
  separacao: "Separação",
  romaneio: "Romaneio",
};

export function labelDe(t: NodeTipo) { return tipoLabel[t]; }

async function one<T>(q: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  const r = await q; return r.data ?? null;
}

/** Coleta vínculos em ambas as direções. Retorna nós vazios em caso de FK ausente. */
export async function coletar(tipo: NodeTipo, id: string): Promise<{ centro: RastroNode | null; relacionados: RastroNode[] }> {
  const rel: RastroNode[] = [];
  let centro: RastroNode | null = null;
  const push = (n: RastroNode) => rel.push(n);

  if (tipo === "pedido") {
    const p = await one(supabase.from("pedidos").select("id,numero,cliente_id,customers(nome_fantasia,razao_social)").eq("id", id).maybeSingle());
    if (p) {
      const cust = p.customers as { nome_fantasia?: string | null; razao_social?: string | null } | null;
      centro = { tipo: "pedido", id, label: `Pedido #${p.numero ?? id.slice(0, 8)}` };
      if (p.cliente_id) push({ tipo: "cliente", id: p.cliente_id, label: cust?.nome_fantasia || cust?.razao_social || "Cliente" });
      const ops = await supabase.from("ordens_producao").select("id,numero").eq("pedido_id", id);
      ops.data?.forEach(o => push({ tipo: "op", id: o.id, label: `OP #${o.numero ?? o.id.slice(0, 8)}` }));
    }
  } else if (tipo === "op") {
    const o = await one(supabase.from("ordens_producao").select("id,numero,pedido_id").eq("id", id).maybeSingle());
    if (o) {
      centro = { tipo: "op", id, label: `OP #${o.numero ?? id.slice(0, 8)}` };
      if (o.pedido_id) push({ tipo: "pedido", id: o.pedido_id, label: `Pedido vinculado` });
      const nfs = await supabase.from("notas_fiscais").select("id,numero,serie").eq("op_id", id);
      nfs.data?.forEach(n => push({ tipo: "nota_fiscal", id: n.id, label: `NF ${n.numero}/${n.serie}` }));
      const sep = await supabase.from("separacoes").select("id,status").eq("op_id", id);
      sep.data?.forEach(s => push({ tipo: "separacao", id: s.id, label: `Separação (${s.status})` }));
      const romi = await supabase.from("romaneio_itens").select("romaneio_id,romaneios(numero,status)").eq("op_id", id);
      romi.data?.forEach(r => {
        const rom = r.romaneios as { numero?: number; status?: string } | null;
        if (r.romaneio_id) push({ tipo: "romaneio", id: r.romaneio_id, label: `Romaneio #${rom?.numero ?? ""} (${rom?.status ?? ""})` });
      });
      const mov = await supabase.from("estoque_movimentos").select("id,tipo,operacao,quantidade").eq("op_id", id).limit(50);
      mov.data?.forEach(m => push({ tipo: "movimento_estoque", id: m.id, label: `Mov. ${m.tipo}/${m.operacao} qtd ${m.quantidade}` }));
    }
  } else if (tipo === "nota_fiscal") {
    const nf = await one(supabase.from("notas_fiscais").select("id,numero,serie,op_id,cliente_id,tipo").eq("id", id).maybeSingle());
    if (nf) {
      centro = { tipo: "nota_fiscal", id, label: `NF ${nf.numero}/${nf.serie} (${nf.tipo})` };
      if (nf.op_id) push({ tipo: "op", id: nf.op_id, label: "OP vinculada" });
      if (nf.cliente_id) push({ tipo: "cliente", id: nf.cliente_id, label: "Cliente" });
      const cr = await supabase.from("contas_receber").select("id,valor,parcela,total_parcelas").eq("nota_fiscal_id", id);
      cr.data?.forEach(c => push({ tipo: "conta_receber", id: c.id, label: `A Receber ${c.parcela}/${c.total_parcelas} R$ ${c.valor}` }));
      const mov = await supabase.from("estoque_movimentos").select("id,tipo,quantidade").eq("nota_fiscal_id", id);
      mov.data?.forEach(m => push({ tipo: "movimento_estoque", id: m.id, label: `Mov. estoque ${m.tipo} qtd ${m.quantidade}` }));
    }
  } else if (tipo === "pedido_compra") {
    const pc = await one(supabase.from("pedidos_compra").select("id,numero,fornecedor_id,fornecedores(razao_social)").eq("id", id).maybeSingle());
    if (pc) {
      const f = pc.fornecedores as { razao_social?: string } | null;
      centro = { tipo: "pedido_compra", id, label: `Pedido Compra #${pc.numero}` };
      if (pc.fornecedor_id) push({ tipo: "fornecedor", id: pc.fornecedor_id, label: f?.razao_social || "Fornecedor" });
      const rec = await supabase.from("recebimentos").select("id,numero,status").eq("pedido_id", id);
      rec.data?.forEach(r => push({ tipo: "recebimento", id: r.id, label: `Recebimento #${r.numero} (${r.status})` }));
      const cp = await supabase.from("contas_pagar").select("id,parcela,total_parcelas,valor").eq("pedido_id", id);
      cp.data?.forEach(c => push({ tipo: "conta_pagar", id: c.id, label: `A Pagar ${c.parcela}/${c.total_parcelas} R$ ${c.valor}` }));
    }
  } else if (tipo === "recebimento") {
    const r = await one(supabase.from("recebimentos").select("id,numero,pedido_id,status").eq("id", id).maybeSingle());
    if (r) {
      centro = { tipo: "recebimento", id, label: `Recebimento #${r.numero}` };
      if (r.pedido_id) push({ tipo: "pedido_compra", id: r.pedido_id, label: "Pedido de Compra" });
      const lotes = await supabase.from("recebimento_itens").select("lote_id,lotes(numero_lote)").eq("recebimento_id", id);
      lotes.data?.forEach(l => {
        const lt = l.lotes as { numero_lote?: string } | null;
        if (l.lote_id) push({ tipo: "lote", id: l.lote_id, label: `Lote ${lt?.numero_lote ?? ""}` });
      });
      const cp = await supabase.from("contas_pagar").select("id,valor,parcela,total_parcelas").eq("recebimento_id", id);
      cp.data?.forEach(c => push({ tipo: "conta_pagar", id: c.id, label: `A Pagar ${c.parcela}/${c.total_parcelas} R$ ${c.valor}` }));
    }
  } else if (tipo === "lote") {
    const l = await one(supabase.from("lotes").select("id,numero_lote,quantidade_disponivel,item_id,tipo").eq("id", id).maybeSingle());
    if (l) {
      centro = { tipo: "lote", id, label: `Lote ${l.numero_lote} — saldo ${l.quantidade_disponivel}` };
      const mov = await supabase.from("estoque_movimentos").select("id,tipo,operacao,quantidade,created_at").eq("lote_id", id).order("created_at", { ascending: false }).limit(100);
      mov.data?.forEach(m => push({ tipo: "movimento_estoque", id: m.id, label: `${m.tipo}/${m.operacao} qtd ${m.quantidade}` }));
    }
  } else if (tipo === "cliente") {
    const c = await one(supabase.from("customers").select("id,razao_social,nome_fantasia").eq("id", id).maybeSingle());
    if (c) {
      centro = { tipo: "cliente", id, label: c.nome_fantasia || c.razao_social || "Cliente" };
      const peds = await supabase.from("pedidos").select("id,numero").eq("cliente_id", id).order("created_at", { ascending: false }).limit(50);
      peds.data?.forEach(p => push({ tipo: "pedido", id: p.id, label: `Pedido #${p.numero ?? p.id.slice(0, 8)}` }));
      const nfs = await supabase.from("notas_fiscais").select("id,numero,serie").eq("cliente_id", id).order("data_emissao", { ascending: false }).limit(50);
      nfs.data?.forEach(n => push({ tipo: "nota_fiscal", id: n.id, label: `NF ${n.numero}/${n.serie}` }));
    }
  } else if (tipo === "fornecedor") {
    const f = await one(supabase.from("fornecedores").select("id,razao_social").eq("id", id).maybeSingle());
    if (f) {
      centro = { tipo: "fornecedor", id, label: f.razao_social };
      const pc = await supabase.from("pedidos_compra").select("id,numero").eq("fornecedor_id", id).order("created_at", { ascending: false }).limit(50);
      pc.data?.forEach(p => push({ tipo: "pedido_compra", id: p.id, label: `PC #${p.numero}` }));
    }
  } else if (tipo === "romaneio") {
    const r = await one(supabase.from("romaneios").select("id,numero,status,transportadora_id").eq("id", id).maybeSingle());
    if (r) {
      centro = { tipo: "romaneio", id, label: `Romaneio #${r.numero} (${r.status})` };
      const itens = await supabase.from("romaneio_itens").select("nota_fiscal_id,op_id,pedido_id").eq("romaneio_id", id);
      itens.data?.forEach(i => {
        if (i.op_id) push({ tipo: "op", id: i.op_id, label: "OP vinculada" });
        if (i.nota_fiscal_id) push({ tipo: "nota_fiscal", id: i.nota_fiscal_id, label: "NF vinculada" });
        if (i.pedido_id) push({ tipo: "pedido", id: i.pedido_id, label: "Pedido vinculado" });
      });
    }
  }

  // Rota de detalhes para cada nó
  for (const n of rel) attachRoute(n);
  if (centro) attachRoute(centro);

  return { centro, relacionados: rel };
}

function attachRoute(n: RastroNode) {
  const map: Partial<Record<NodeTipo, (id: string) => RastroNode["route"]>> = {
    pedido: () => ({ to: "/producao/pedidos" }),
    op: () => ({ to: "/producao/op" }),
    nota_fiscal: () => ({ to: "/fiscal/nota-fiscal" }),
    cliente: () => ({ to: "/clientes" }),
    fornecedor: () => ({ to: "/compras/fornecedores" }),
    pedido_compra: (id) => ({ to: "/compras/pedidos/$id", params: { id } }),
    recebimento: (id) => ({ to: "/compras/recebimentos/$id", params: { id } }),
    conta_pagar: () => ({ to: "/compras/contas-pagar" }),
    conta_receber: () => ({ to: "/financeiro" }),
    lote: () => ({ to: "/lotes" }),
    movimento_estoque: () => ({ to: "/estoque/kardex" }),
    movimento_financeiro: () => ({ to: "/financeiro/movimentos" }),
    separacao: () => ({ to: "/logistica/separacoes" }),
    romaneio: () => ({ to: "/logistica/romaneios" }),
  };
  n.route = map[n.tipo]?.(n.id);
}
