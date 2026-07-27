-- 1. Tabela article_bom já existe, mas vamos garantir índices para performance recursiva
CREATE INDEX IF NOT EXISTS idx_article_bom_article_id ON public.article_bom(article_id);
CREATE INDEX IF NOT EXISTS idx_article_bom_ref_id ON public.article_bom(ref_id) WHERE ref_id IS NOT NULL;

-- 2. Função recursiva explode_bom para explosão multi-nível
CREATE OR REPLACE FUNCTION public.explode_bom(
    p_article_id UUID,
    p_quantidade_base NUMERIC DEFAULT 1.0,
    p_max_depth INTEGER DEFAULT 10
)
RETURNS TABLE (
    article_id UUID,
    component_id UUID,
    component_ref_id UUID,
    component_ref_tipo TEXT,
    component_descricao TEXT,
    unidade TEXT,
    quantidade_liquida NUMERIC,
    quantidade_bruta NUMERIC,
    nivel INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE bom_tree AS (
        SELECT 
            b.article_id as parent_id,
            b.ref_id,
            b.ref_tipo,
            b.descricao,
            b.unidade,
            (p_quantidade_base * b.qtd_por_kg) as qty_liq,
            (p_quantidade_base * b.qtd_por_kg * (1 + COALESCE(b.fator_perda_pct, 0) / 100)) as qty_bru,
            1 as depth,
            ARRAY[b.id] as path
        FROM public.article_bom b
        WHERE b.article_id = p_article_id

        UNION ALL

        SELECT 
            bt.parent_id,
            b.ref_id,
            b.ref_tipo,
            b.descricao,
            b.unidade,
            (bt.qty_liq * b.qtd_por_kg) as qty_liq,
            (bt.qty_bru * b.qtd_por_kg * (1 + COALESCE(b.fator_perda_pct, 0) / 100)) as qty_bru,
            bt.depth + 1,
            bt.path || b.id
        FROM bom_tree bt
        JOIN public.article_bom b ON b.article_id = bt.ref_id
        WHERE bt.ref_tipo = 'artigo' 
          AND bt.depth < p_max_depth
          AND NOT (b.id = ANY(bt.path))
    )
    SELECT 
        bt.parent_id,
        CASE WHEN bt.ref_tipo = 'artigo' THEN bt.ref_id ELSE NULL END as component_id,
        bt.ref_id,
        bt.ref_tipo,
        bt.descricao,
        bt.unidade,
        SUM(bt.qty_liq) as quantidade_liquida,
        SUM(bt.qty_bru) as quantidade_bruta,
        MAX(bt.depth) as nivel
    FROM bom_tree bt
    GROUP BY bt.parent_id, bt.ref_id, bt.ref_tipo, bt.descricao, bt.unidade;
END;
$$;

-- 3. View vw_mrp_explosion para consolidar Necessidade Bruta + Saldo + Trânsito
CREATE OR REPLACE VIEW public.vw_mrp_explosion AS
WITH Estoque AS (
    SELECT 
        l.item_id as ref_id,
        SUM(l.quantidade_disponivel) as estoque_disponivel
    FROM public.lotes l
    WHERE l.habilitado = true
    GROUP BY l.item_id
),
Reservas AS (
    SELECT 
        r.item_id as ref_id,
        SUM(r.quantidade_reservada - COALESCE(r.quantidade_consumida, 0)) as estoque_reservado
    FROM public.op_reservas_lote r
    WHERE r.status = 'ativa'
    GROUP BY r.item_id
),
Transito AS (
    SELECT 
        pci.ref_id,
        SUM(pci.quantidade - pci.quantidade_recebida) as em_transito
    FROM public.pedidos_compra_itens pci
    JOIN public.pedidos_compra pc ON pc.id = pci.pedido_id
    WHERE pc.status IN ('enviado', 'confirmado', 'parcial', 'aprovado')
    GROUP BY pci.ref_id
)
SELECT 
    COALESCE(e.ref_id, t.ref_id, r.ref_id) as ref_id,
    COALESCE(e.estoque_disponivel, 0) as estoque_disponivel,
    COALESCE(r.estoque_reservado, 0) as estoque_reservado,
    COALESCE(e.estoque_disponivel, 0) - COALESCE(r.estoque_reservado, 0) as saldo_liquido,
    COALESCE(t.em_transito, 0) as em_transito
FROM Estoque e
FULL OUTER JOIN Transito t ON e.ref_id = t.ref_id
FULL OUTER JOIN Reservas r ON COALESCE(e.ref_id, t.ref_id) = r.ref_id;

-- 4. Grants
GRANT SELECT ON public.vw_mrp_explosion TO authenticated;
GRANT ALL ON public.vw_mrp_explosion TO service_role;
