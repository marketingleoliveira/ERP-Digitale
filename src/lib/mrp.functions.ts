/**
 * MRP clássico — explosão de BOM, saldo, necessidade líquida e sugestões.
 * Utiliza motor de explosão recursivo no banco de dados.
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
  estoque_reservado: number;
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

    let demandas = data.demandas;
    
    // 1) Se não vieram demandas, agrega das OPs em aberto (planejadas, programadas, em produção)
    if (demandas.length === 0) {
      const { data: opItens } = await supabase.from("op_itens")
        .select("op_id, product_id, quantidade_planejada, quantidade_produzida, ordens_producao!inner(status)")
        .in("ordens_producao.status" as never, ["planejada", "programada", "em_producao", "parcial"]);
      
      const { data: prods } = await supabase.from("products").select("id, article_id");
      const prodArt = new Map<string, string>();
      for (const p of (prods ?? [])) if (p.article_id) prodArt.set(p.id, p.article_id);

      const agg = new Map<string, number>();
      for (const it of (opItens ?? [])) {
        const restante = Math.max(0, Number(it.quantidade_planejada || 0) - Number(it.quantidade_produzida || 0));
        if (restante <= 0) continue;
        const artId = it.product_id ? prodArt.get(it.product_id) : undefined;
        if (!artId) continue;
        agg.set(artId, (agg.get(artId) ?? 0) + restante);
      }
      demandas = [...agg.entries()].map(([article_id, quantidade_kg]) => ({ article_id, quantidade_kg }));
    }

    if (demandas.length === 0) return { linhas: [] as MrpLinha[], demandas };

    // 2) Chamadas recursivas para explosão de BOM no banco (RPC explode_bom)
    const explosaoPromessas = demandas.map(d => 
      supabase.rpc("explode_bom" as never, { 
        p_article_id: d.article_id, 
        p_quantidade_base: d.quantidade_kg 
      })
    );
    
    const explosaoResultados = await Promise.all(explosaoPromessas);
    const brutasMap = new Map<string, any>();
    
    demandas.forEach((d, idx) => {
      const { data: itens, error } = explosaoResultados[idx];
      if (error) return;
      
      (itens as any[] ?? []).forEach(it => {
        const key = it.component_ref_id ? `${it.component_ref_tipo}:${it.component_ref_id}` : `desc:${it.component_descricao}`;
        const cur = brutasMap.get(key);
        const origem = { article_id: d.article_id, qtd_kg: d.quantidade_kg };
        
        if (cur) {
          cur.quantidade_bruta += it.quantidade_bruta;
          cur.origem.push(origem);
        } else {
          brutasMap.set(key, {
            ...it,
            origem: [origem]
          });
        }
      });
    });

    // 3) Consultar saldos, reservas e trânsito via View consolidada
    const refIds = [...brutasMap.values()].map(b => b.component_ref_id).filter(Boolean);
    const { data: saldos } = await supabase.from("vw_mrp_explosion")
      .select("*")
      .in("ref_id", refIds);
    
    const saldoMap = new Map(saldos?.map(s => [s.ref_id, s]) ?? []);

    // 4) Fornecedores e Prazos (última compra/lote)
    const { data: lastLotes } = await supabase.from("lotes")
      .select("item_id, fornecedor_id, fornecedores(razao_social, nome_fantasia, prazo_entrega_dias)")
      .in("item_id", refIds)
      .order("created_at", { ascending: false });
    
    const fornMap = new Map<string, any>();
    lastLotes?.forEach(l => {
      if (l.item_id && !fornMap.has(l.item_id)) fornMap.set(l.item_id, l.fornecedores);
    });

    // 5) Enriquecer nomes de artigos de origem
    const artOrigemIds = [...new Set(demandas.map(d => d.article_id))];
    const { data: artsInfo } = await supabase.from("articles").select("id, codigo, nome").in("id", artOrigemIds);
    const artsInfoMap = new Map(artsInfo?.map(a => [a.id, a]) ?? []);

    // 6) Montar resultado final
    const linhas: MrpLinha[] = [...brutasMap.values()].map(b => {
      const s = b.component_ref_id ? saldoMap.get(b.component_ref_id) : null;
      const forn = b.component_ref_id ? fornMap.get(b.component_ref_id) : null;
      
      const est = Number(s?.estoque_disponivel ?? 0);
      const res = Number(s?.estoque_reservado ?? 0);
      const tra = Number(s?.em_transito ?? 0);
      const seg = b.quantidade_bruta * (data.estoque_seguranca_pct / 100);
      
      const liq = Math.max(0, b.quantidade_bruta - (est - res) - tra + seg);
      
      return {
        ref_tipo: b.component_ref_tipo,
        ref_id: b.component_ref_id,
        descricao: b.component_descricao,
        unidade: b.unidade,
        necessidade_bruta: Number(b.quantidade_bruta.toFixed(3)),
        estoque_disponivel: Number(est.toFixed(3)),
        estoque_reservado: Number(res.toFixed(3)),
        em_transito: Number(tra.toFixed(3)),
        estoque_seguranca: Number(seg.toFixed(3)),
        necessidade_liquida: Number(liq.toFixed(3)),
        fornecedor_id: forn?.id ?? null,
        fornecedor_nome: forn ? (forn.nome_fantasia || forn.razao_social) : null,
        prazo_entrega_dias: forn?.prazo_entrega_dias ?? null,
        urgencia: liq <= 0 ? "verde" : (est - res + tra) < b.quantidade_bruta * 0.5 ? "vermelho" : "amarelo",
        origem_articles: b.origem.map((o: any) => ({
          ...o,
          codigo: artsInfoMap.get(o.article_id)?.codigo ?? "",
          nome: artsInfoMap.get(o.article_id)?.nome ?? "",
        }))
      };
    }).sort((a, b) => b.necessidade_liquida - a.necessidade_liquida);

    return { linhas, demandas };
  });
