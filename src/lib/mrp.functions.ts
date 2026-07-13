/**
 * MRP clássico — explosão de BOM, saldo, necessidade líquida e sugestões.
 * Entrada: lista de {article_id, quantidade_kg}. Se vazia, o server agrega
 * automaticamente as OPs em aberto (matching articles.codigo ↔ op_itens.descricao).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const inputSchema = z.object({
  demandas: z.array(z.object({
    article_id: z.string().uuid(),
    quantidade_kg: z.number().positive(),
    pedido_id: z.string().uuid().nullable().optional(),
  })).default([]),
  estoque_seguranca_pct: z.number().min(0).max(100).default(0),
});

export type MrpLinha = {
  ref_tipo: string;
  ref_id: string | null;
  descricao: string;
  unidade: string;
  necessidade_bruta: number;
  estoque_disponivel: number;
  em_transito: number;
  estoque_seguranca: number;
  necessidade_liquida: number;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  prazo_entrega_dias: number | null;
  urgencia: "verde" | "amarelo" | "vermelho";
  origem_articles: { article_id: string; codigo: string; nome: string; qtd_kg: number }[];
};

export const computeMrp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1) Se não vieram demandas, agrega das OPs em aberto
    let demandas = data.demandas;
    if (demandas.length === 0) {
      const [{ data: arts }, { data: opits }] = await Promise.all([
        supabase.from("articles").select("id, codigo, nome").eq("ativo", true),
        supabase.from("op_itens").select("op_id, descricao, quantidade_planejada, quantidade_produzida"),
      ]);
      const { data: openOps } = await supabase.from("ordens_producao")
        .select("id, status").in("status", ["planejada", "programada", "em_producao", "parcial"]);
      const openIds = new Set((openOps ?? []).map(o => o.id));
      const agg = new Map<string, number>();
      for (const it of (opits ?? [])) {
        if (!openIds.has(it.op_id)) continue;
        const restante = Math.max(0, Number(it.quantidade_planejada || 0) - Number(it.quantidade_produzida || 0));
        if (restante <= 0) continue;
        const desc = (it.descricao || "").toUpperCase();
        const art = (arts ?? []).find(a => desc.includes((a.codigo || "").toUpperCase()) || desc.includes((a.nome || "").toUpperCase()));
        if (!art) continue;
        agg.set(art.id, (agg.get(art.id) ?? 0) + restante);
      }
      demandas = [...agg.entries()].map(([article_id, quantidade_kg]) => ({ article_id, quantidade_kg }));
    }

    if (demandas.length === 0) return { linhas: [] as MrpLinha[], demandas };

    const articleIds = [...new Set(demandas.map(d => d.article_id))];
    const [{ data: articlesData }, { data: bomAll }] = await Promise.all([
      supabase.from("articles").select("id, codigo, nome").in("id", articleIds),
      supabase.from("article_bom").select("*").in("article_id", articleIds),
    ]);

    // 2) Explosão da BOM (agrupada por ref_tipo|ref_id ou descricao)
    type Bruta = {
      key: string; ref_tipo: string; ref_id: string | null; descricao: string; unidade: string;
      qtd: number; origem: { article_id: string; codigo: string; nome: string; qtd_kg: number }[];
    };
    const brutas = new Map<string, Bruta>();
    for (const d of demandas) {
      const boms = (bomAll ?? []).filter(b => b.article_id === d.article_id);
      const art = (articlesData ?? []).find(a => a.id === d.article_id);
      for (const b of boms) {
        const perda = Number(b.fator_perda_pct || 0) / 100;
        const qtdKg = Number(b.qtd_por_kg || 0) * d.quantidade_kg * (1 + perda);
        const key = b.ref_id ? `${b.ref_tipo}:${b.ref_id}` : `desc:${b.descricao}`;
        const cur = brutas.get(key);
        const origem = { article_id: d.article_id, codigo: art?.codigo ?? "", nome: art?.nome ?? "", qtd_kg: d.quantidade_kg };
        if (cur) { cur.qtd += qtdKg; cur.origem.push(origem); }
        else brutas.set(key, {
          key, ref_tipo: b.ref_tipo || b.tipo || "componente", ref_id: b.ref_id,
          descricao: b.descricao || "—", unidade: b.unidade || "kg",
          qtd: qtdKg, origem: [origem],
        });
      }
    }

    // 3) Saldo em estoque (lotes) e em trânsito (pedidos_compra_itens não recebidos)
    const refIds = [...brutas.values()].map(b => b.ref_id).filter(Boolean) as string[];
    const [{ data: lotes }, { data: pcItens }] = await Promise.all([
      refIds.length ? supabase.from("lotes").select("item_id, quantidade_disponivel").in("item_id", refIds).eq("habilitado", true) : Promise.resolve({ data: [] as { item_id: string; quantidade_disponivel: number }[] }),
      refIds.length ? supabase.from("pedidos_compra_itens").select("ref_id, quantidade, quantidade_recebida, pedido_id").in("ref_id", refIds) : Promise.resolve({ data: [] as { ref_id: string; quantidade: number; quantidade_recebida: number; pedido_id: string }[] }),
    ]);
    const { data: pcOpen } = await supabase.from("pedidos_compra")
      .select("id, fornecedor_id, prazo_entrega").in("status", ["enviado", "confirmado", "parcial", "aprovado"]);
    const openPcIds = new Set((pcOpen ?? []).map(p => p.id));

    const saldoMap = new Map<string, number>();
    for (const l of (lotes ?? [])) {
      saldoMap.set(l.item_id, (saldoMap.get(l.item_id) ?? 0) + Number(l.quantidade_disponivel || 0));
    }
    const transitoMap = new Map<string, number>();
    for (const p of (pcItens ?? [])) {
      if (!p.ref_id || !openPcIds.has(p.pedido_id)) continue;
      const pend = Math.max(0, Number(p.quantidade || 0) - Number(p.quantidade_recebida || 0));
      transitoMap.set(p.ref_id, (transitoMap.get(p.ref_id) ?? 0) + pend);
    }

    // 4) Fornecedor preferencial: último lote recebido do item
    const { data: lastLotes } = refIds.length
      ? await supabase.from("lotes").select("item_id, fornecedor_id, created_at").in("item_id", refIds).order("created_at", { ascending: false })
      : { data: [] as { item_id: string; fornecedor_id: string | null; created_at: string }[] };
    const fornecMap = new Map<string, string>();
    for (const l of (lastLotes ?? [])) {
      if (l.fornecedor_id && !fornecMap.has(l.item_id)) fornecMap.set(l.item_id, l.fornecedor_id);
    }
    const fornIds = [...new Set([...fornecMap.values()])].filter((x): x is string => !!x);
    const { data: forns } = fornIds.length
      ? await supabase.from("fornecedores").select("id, razao_social, nome_fantasia, prazo_entrega_dias").in("id", fornIds)
      : { data: [] as { id: string; razao_social: string; nome_fantasia: string | null; prazo_entrega_dias: number | null }[] };

    // 5) Monta linhas
    const linhas: MrpLinha[] = [...brutas.values()].map(b => {
      const est = b.ref_id ? (saldoMap.get(b.ref_id) ?? 0) : 0;
      const tra = b.ref_id ? (transitoMap.get(b.ref_id) ?? 0) : 0;
      const seg = b.qtd * (data.estoque_seguranca_pct / 100);
      const liq = Math.max(0, b.qtd - est - tra + seg);
      const fId = b.ref_id ? fornecMap.get(b.ref_id) ?? null : null;
      const forn = fId ? (forns ?? []).find(f => f.id === fId) : null;
      const urgencia: MrpLinha["urgencia"] =
        liq <= 0 ? "verde" : (est + tra) < b.qtd * 0.5 ? "vermelho" : "amarelo";
      return {
        ref_tipo: b.ref_tipo, ref_id: b.ref_id, descricao: b.descricao, unidade: b.unidade,
        necessidade_bruta: Number(b.qtd.toFixed(3)),
        estoque_disponivel: Number(est.toFixed(3)),
        em_transito: Number(tra.toFixed(3)),
        estoque_seguranca: Number(seg.toFixed(3)),
        necessidade_liquida: Number(liq.toFixed(3)),
        fornecedor_id: fId,
        fornecedor_nome: forn ? (forn.nome_fantasia || forn.razao_social) : null,
        prazo_entrega_dias: forn?.prazo_entrega_dias ?? null,
        urgencia,
        origem_articles: b.origem,
      };
    }).sort((a, b) => b.necessidade_liquida - a.necessidade_liquida);

    return { linhas, demandas };
  });
