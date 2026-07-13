/**
 * MRP → Sugestões de Ordens de Produção.
 * Não cria OPs automaticamente. Gera sugestões que o PCP revisa e aprova.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type OpSugestao = {
  key: string;
  article_id: string;
  article_codigo: string;
  article_nome: string;
  product_id: string | null;
  product_nome: string | null;
  variante_id: string | null;
  quantidade_kg: number;
  pedidos: { pedido_id: string; numero: string; cliente: string | null; qtd: number; prazo: string | null }[];
  data_necessaria: string | null;
  prioridade: number; // 1 (mais urgente) - 10
  roteiro_id: string | null;
  roteiro_codigo: string | null;
  maquinas_elegiveis: { id: string; nome: string; kg_por_hora: number }[];
  capacidade_kg_dia: number;
  duracao_estimada_horas: number | null;
  materiais_disponiveis: { descricao: string; necessario: number; disponivel: number }[];
  materiais_faltantes: { descricao: string; necessario: number; disponivel: number; deficit: number }[];
  alertas: string[];
  risco_atraso: "verde" | "amarelo" | "vermelho";
};

function calcPrioridade(diasParaEntrega: number | null): number {
  if (diasParaEntrega === null) return 5;
  if (diasParaEntrega <= 0) return 1;
  if (diasParaEntrega <= 3) return 2;
  if (diasParaEntrega <= 7) return 3;
  if (diasParaEntrega <= 15) return 5;
  if (diasParaEntrega <= 30) return 7;
  return 9;
}

export const computeOpSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { supabase } = context;

    // 1) Buscar pedidos confirmados e seus itens
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, numero, cliente_id, prazo_entrega, status, customers(razao_social, nome_fantasia)")
      .eq("status", "confirmado");
    const pedidoIds = (pedidos ?? []).map(p => p.id);
    if (pedidoIds.length === 0) return { sugestoes: [] as OpSugestao[] };

    const { data: itens } = await supabase
      .from("pedido_itens")
      .select("id, pedido_id, product_id, variante_id, descricao, quantidade")
      .in("pedido_id", pedidoIds);

    // Descontar o que já está em OPs abertas (por pedido_item_id)
    const { data: opitens } = await supabase
      .from("op_itens")
      .select("pedido_item_id, quantidade_planejada, ordens_producao!inner(status)")
      .in("pedido_item_id", (itens ?? []).map(i => i.id).filter(Boolean));
    const jaEmOp = new Map<string, number>();
    for (const oi of (opitens ?? []) as { pedido_item_id: string; quantidade_planejada: number; ordens_producao: { status: string } }[]) {
      if (!oi.pedido_item_id) continue;
      const s = oi.ordens_producao?.status;
      if (s === "cancelada" || s === "encerrada") continue;
      jaEmOp.set(oi.pedido_item_id, (jaEmOp.get(oi.pedido_item_id) ?? 0) + Number(oi.quantidade_planejada || 0));
    }

    const productIds = [...new Set((itens ?? []).map(i => i.product_id).filter(Boolean) as string[])];
    const { data: products } = productIds.length
      ? await supabase.from("products").select("id, nome, article_id").in("id", productIds)
      : { data: [] as { id: string; nome: string; article_id: string | null }[] };
    const prodMap = new Map(products?.map(p => [p.id, p]) ?? []);

    // 2) Agrupar por (article_id, product_id, variante_id)
    type Agg = {
      key: string; article_id: string; product_id: string | null; variante_id: string | null;
      product_nome: string | null; qtd: number;
      pedidos: OpSugestao["pedidos"];
    };
    const groups = new Map<string, Agg>();
    for (const it of (itens ?? [])) {
      if (!it.product_id) continue;
      const prod = prodMap.get(it.product_id);
      if (!prod?.article_id) continue;
      const pendente = Number(it.quantidade || 0) - (jaEmOp.get(it.id) ?? 0);
      if (pendente <= 0) continue;
      const key = `${prod.article_id}|${it.product_id}|${it.variante_id ?? ""}`;
      const ped = (pedidos ?? []).find(p => p.id === it.pedido_id);
      const cust = ped?.customers as { razao_social?: string; nome_fantasia?: string } | null | undefined;
      const clienteNome = cust ? (cust.nome_fantasia || cust.razao_social || null) : null;
      const cur = groups.get(key);
      const pedInfo = { pedido_id: it.pedido_id, numero: ped?.numero ?? "?", cliente: clienteNome, qtd: pendente, prazo: ped?.prazo_entrega ?? null };
      if (cur) { cur.qtd += pendente; cur.pedidos.push(pedInfo); }
      else groups.set(key, {
        key, article_id: prod.article_id, product_id: it.product_id, variante_id: it.variante_id,
        product_nome: prod.nome, qtd: pendente, pedidos: [pedInfo],
      });
    }

    if (groups.size === 0) return { sugestoes: [] as OpSugestao[] };

    // 3) Dados auxiliares
    const articleIds = [...new Set([...groups.values()].map(g => g.article_id))];
    const [{ data: articles }, { data: boms }, { data: roteiros }] = await Promise.all([
      supabase.from("articles").select("id, codigo, nome").in("id", articleIds),
      supabase.from("article_bom").select("*").in("article_id", articleIds),
      supabase.from("roteiros").select("id, codigo, article_id, revisao").in("article_id", articleIds).eq("ativo", true),
    ]);
    const roteiroPorArt = new Map<string, { id: string; codigo: string }>();
    for (const r of (roteiros ?? []).sort((a, b) => b.revisao - a.revisao)) {
      if (r.article_id && !roteiroPorArt.has(r.article_id)) roteiroPorArt.set(r.article_id, { id: r.id, codigo: r.codigo });
    }
    const roteiroIds = [...roteiroPorArt.values()].map(r => r.id);
    const { data: etapas } = roteiroIds.length
      ? await supabase.from("roteiro_etapas").select("roteiro_id, maquina_preferencial_id, tempo_padrao_min").in("roteiro_id", roteiroIds)
      : { data: [] as { roteiro_id: string; maquina_preferencial_id: string | null; tempo_padrao_min: number }[] };
    const maquinaIds = [...new Set((etapas ?? []).map(e => e.maquina_preferencial_id).filter(Boolean) as string[])];
    const [{ data: maquinas }, { data: capacidades }] = await Promise.all([
      maquinaIds.length ? supabase.from("maquinas").select("id, nome").in("id", maquinaIds) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      maquinaIds.length ? supabase.from("maquina_capacidade").select("*").in("maquina_id", maquinaIds) : Promise.resolve({ data: [] as { maquina_id: string; kg_por_hora: number; horas_por_turno: number; turnos_por_dia: number; dias_uteis_semana: number; eficiencia_alvo_pct: number }[] }),
    ]);
    const capMap = new Map(capacidades?.map(c => [c.maquina_id, c]) ?? []);
    const maqMap = new Map(maquinas?.map(m => [m.id, m]) ?? []);

    // Materiais: saldo em lotes
    const bomRefIds = [...new Set((boms ?? []).map(b => b.ref_id).filter(Boolean) as string[])];
    const { data: lotes } = bomRefIds.length
      ? await supabase.from("lotes").select("item_id, quantidade_disponivel").in("item_id", bomRefIds).eq("habilitado", true)
      : { data: [] as { item_id: string; quantidade_disponivel: number }[] };
    const saldoMap = new Map<string, number>();
    for (const l of (lotes ?? [])) saldoMap.set(l.item_id, (saldoMap.get(l.item_id) ?? 0) + Number(l.quantidade_disponivel || 0));

    // Calendário próximos 60 dias — dias não úteis
    const hoje = new Date();
    const daqui60 = new Date(hoje); daqui60.setDate(hoje.getDate() + 60);
    const { data: cal } = await supabase.from("calendario_produtivo")
      .select("data, tipo").gte("data", hoje.toISOString().slice(0, 10)).lte("data", daqui60.toISOString().slice(0, 10));
    const diasIndisponiveis = new Set((cal ?? []).filter(c => c.tipo !== "util").map(c => c.data));

    // 4) Montar sugestões
    const sugestoes: OpSugestao[] = [...groups.values()].map(g => {
      const art = (articles ?? []).find(a => a.id === g.article_id);
      const rot = roteiroPorArt.get(g.article_id) ?? null;
      const etapasR = rot ? (etapas ?? []).filter(e => e.roteiro_id === rot.id) : [];
      const maquinasEleg = [...new Set(etapasR.map(e => e.maquina_preferencial_id).filter(Boolean) as string[])]
        .map(id => {
          const m = maqMap.get(id); const c = capMap.get(id);
          return { id, nome: m?.nome ?? "?", kg_por_hora: Number(c?.kg_por_hora ?? 0) };
        });
      const kgHoraTotal = maquinasEleg.reduce((a, m) => a + m.kg_por_hora, 0);
      const capDia = maquinasEleg.reduce((a, m) => {
        const c = capMap.get(m.id); if (!c) return a;
        return a + m.kg_por_hora * Number(c.horas_por_turno) * Number(c.turnos_por_dia) * (Number(c.eficiencia_alvo_pct) / 100);
      }, 0);
      const duracaoH = kgHoraTotal > 0 ? g.qtd / kgHoraTotal : null;

      // Prazo mínimo dos pedidos
      const prazos = g.pedidos.map(p => p.prazo).filter(Boolean) as string[];
      const dataNec = prazos.length ? prazos.sort()[0] : null;
      const diasParaPrazo = dataNec ? Math.ceil((new Date(dataNec).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null;

      // Materiais
      const bomsArt = (boms ?? []).filter(b => b.article_id === g.article_id);
      const disponiveis: OpSugestao["materiais_disponiveis"] = [];
      const faltantes: OpSugestao["materiais_faltantes"] = [];
      for (const b of bomsArt) {
        const perda = Number(b.fator_perda_pct || 0) / 100;
        const need = Number(b.qtd_por_kg || 0) * g.qtd * (1 + perda);
        const disp = b.ref_id ? (saldoMap.get(b.ref_id) ?? 0) : 0;
        if (disp >= need) disponiveis.push({ descricao: b.descricao, necessario: Number(need.toFixed(3)), disponivel: Number(disp.toFixed(3)) });
        else faltantes.push({ descricao: b.descricao, necessario: Number(need.toFixed(3)), disponivel: Number(disp.toFixed(3)), deficit: Number((need - disp).toFixed(3)) });
      }

      // Alertas
      const alertas: string[] = [];
      if (bomsArt.length === 0) alertas.push("BOM ausente para o artigo");
      if (!rot) alertas.push("Roteiro vigente ausente");
      if (maquinasEleg.length === 0) alertas.push("Nenhuma máquina configurada nas etapas");
      if (kgHoraTotal === 0 && maquinasEleg.length > 0) alertas.push("Máquinas sem capacidade cadastrada");
      if (faltantes.length > 0) alertas.push(`${faltantes.length} material(is) em falta`);
      if (dataNec && diasIndisponiveis.has(dataNec)) alertas.push(`Prazo (${dataNec}) cai em feriado/parada`);

      // Risco de atraso
      let risco: OpSugestao["risco_atraso"] = "verde";
      if (duracaoH !== null && diasParaPrazo !== null) {
        const diasNec = duracaoH / 24; // aproximação — capDia já considera turnos
        const folga = diasParaPrazo - diasNec - (faltantes.length > 0 ? 5 : 0);
        if (folga < 0) risco = "vermelho";
        else if (folga < 3) risco = "amarelo";
      } else if (faltantes.length > 0) risco = "amarelo";
      if (alertas.length > 0 && risco === "verde") risco = "amarelo";

      return {
        key: g.key,
        article_id: g.article_id,
        article_codigo: art?.codigo ?? "?",
        article_nome: art?.nome ?? "?",
        product_id: g.product_id, product_nome: g.product_nome,
        variante_id: g.variante_id,
        quantidade_kg: Number(g.qtd.toFixed(3)),
        pedidos: g.pedidos,
        data_necessaria: dataNec,
        prioridade: calcPrioridade(diasParaPrazo),
        roteiro_id: rot?.id ?? null,
        roteiro_codigo: rot?.codigo ?? null,
        maquinas_elegiveis: maquinasEleg,
        capacidade_kg_dia: Number(capDia.toFixed(2)),
        duracao_estimada_horas: duracaoH !== null ? Number(duracaoH.toFixed(2)) : null,
        materiais_disponiveis: disponiveis,
        materiais_faltantes: faltantes,
        alertas,
        risco_atraso: risco,
      };
    }).sort((a, b) => a.prioridade - b.prioridade);

    return { sugestoes };
  });

// ============ Aprovação e geração da OP ============

const gerarSchema = z.object({
  article_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  variante_id: z.string().uuid().nullable(),
  quantidade_kg: z.number().positive(),
  prioridade: z.number().int().min(1).max(10).default(5),
  maquina_id: z.string().uuid().nullable(),
  data_prevista: z.string().nullable(),
  pedido_ids: z.array(z.string().uuid()).default([]),
  descricao: z.string().optional(),
  reservar_materiais: z.boolean().default(true),
});

export const gerarOpDaSugestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => gerarSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Número da OP
    const { data: numRes, error: numErr } = await supabase.rpc("proximo_numero_op");
    if (numErr) throw new Error(numErr.message);
    const numero = numRes as unknown as number;

    // Insere OP
    const { data: opRow, error: opErr } = await supabase.from("ordens_producao").insert({
      numero,
      pedido_id: data.pedido_ids[0] ?? null,
      status: "planejada" as const,
      prioridade: data.prioridade,
      maquina_id: data.maquina_id,
      data_prevista: data.data_prevista,
      observacao: `Origem: MRP${data.pedido_ids.length > 1 ? ` · Pedidos: ${data.pedido_ids.length}` : ""}`,
    }).select("id").single();
    if (opErr) throw new Error(opErr.message);
    const opId = opRow.id;

    // op_itens
    const { error: itErr } = await supabase.from("op_itens").insert({
      op_id: opId,
      product_id: data.product_id,
      variante_id: data.variante_id,
      descricao: data.descricao ?? null,
      quantidade_planejada: data.quantidade_kg,
      unidade: "KG",
    });
    if (itErr) throw new Error(itErr.message);

    // Evento com rastreabilidade da origem MRP
    await supabase.from("op_eventos").insert({
      op_id: opId,
      tipo: "criada_mrp",
      payload: {
        origem: "MRP",
        article_id: data.article_id,
        pedido_ids: data.pedido_ids,
      },
    });

    // Reserva de materiais (opcional)
    let reservaResult: unknown = null;
    if (data.reservar_materiais) {
      const { data: r, error: rErr } = await supabase.rpc("op_reservar_materiais", { _op_id: opId });
      if (rErr) throw new Error(`OP criada (#${numero}), mas falha ao reservar: ${rErr.message}`);
      reservaResult = r;
    }

    return { ok: true, op_id: opId, numero, reserva: reservaResult };
  });
