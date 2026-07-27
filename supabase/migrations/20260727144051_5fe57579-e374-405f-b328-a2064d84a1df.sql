-- Migration: BOM Cost Engine
-- Part 1: Function to get the best cost for a component
CREATE OR REPLACE FUNCTION public.get_best_article_cost(p_article_id uuid)
RETURNS TABLE(
    cost_value numeric,
    cost_source text,
    cost_date timestamptz,
    is_missing boolean,
    is_outdated boolean
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_avg_cost numeric;
    v_last_lot_cost numeric;
    v_last_po_cost numeric;
    v_standard_cost numeric;
    v_last_lot_date timestamptz;
    v_last_po_date timestamptz;
BEGIN
    -- 1. Average cost from production (calculated via view)
    SELECT custo_medio_un INTO v_avg_cost
    FROM public.vw_custos_produto
    WHERE product_id IN (SELECT id FROM public.products WHERE article_id = p_article_id)
    LIMIT 1;

    IF v_avg_cost > 0 THEN
        RETURN QUERY SELECT v_avg_cost, 'Custo Médio (Produção)'::text, now(), false, false;
        RETURN;
    END IF;

    -- 2. Last Lot Cost
    SELECT costo_unitario, created_at INTO v_last_lot_cost, v_last_lot_date
    FROM public.lotes
    WHERE item_id = p_article_id
    ORDER BY created_at DESC LIMIT 1;

    IF v_last_lot_cost > 0 THEN
        RETURN QUERY SELECT v_last_lot_cost, 'Último Lote'::text, v_last_lot_date, false, (v_last_lot_date < now() - interval '90 days');
        RETURN;
    END IF;

    -- 3. Last Purchase Order Price
    SELECT preco_unitario, created_at INTO v_last_po_cost, v_last_po_date
    FROM public.pedidos_compra_itens
    WHERE ref_id = p_article_id AND ref_tipo = 'artigo'
    ORDER BY created_at DESC LIMIT 1;

    IF v_last_po_cost > 0 THEN
        RETURN QUERY SELECT v_last_po_cost, 'Último Pedido Compra'::text, v_last_po_date, false, (v_last_po_date < now() - interval '180 days');
        RETURN;
    END IF;

    -- 4. Standard Cost from article table
    SELECT r_custo INTO v_standard_cost
    FROM public.articles
    WHERE id = p_article_id;

    IF v_standard_cost > 0 THEN
        RETURN QUERY SELECT v_standard_cost, 'Custo Padrão'::text, now(), false, false;
        RETURN;
    END IF;

    -- 5. No cost found
    RETURN QUERY SELECT 0::numeric, 'Não Informado'::text, NULL::timestamptz, true, false;
END;
$$;

-- Part 2: Main BOM Cost Explosion Function
CREATE OR REPLACE FUNCTION public.explode_bom_cost(
    p_article_id uuid, 
    p_quantidade_base numeric DEFAULT 1.0, 
    p_max_depth integer DEFAULT 10
)
RETURNS TABLE(
    article_id uuid,
    component_ref_id uuid,
    component_ref_tipo text,
    component_descricao text,
    codigo text,
    unidade text,
    nivel integer,
    quantidade_liquida numeric,
    quantidade_bruta numeric,
    custo_unitario numeric,
    custo_liquido numeric,
    custo_perda numeric,
    custo_total_linha numeric,
    origem_custo text,
    data_custo timestamptz,
    status_custo text,
    is_missing boolean,
    is_outdated boolean,
    path uuid[]
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    -- Check permissions
    IF NOT public.has_role(auth.uid(), 'admin') AND 
       NOT public.has_role(auth.uid(), 'gerente') AND 
       NOT public.has_role(auth.uid(), 'financeiro') AND 
       NOT public.has_role(auth.uid(), 'producao') THEN
        RAISE EXCEPTION 'Acesso negado aos custos industriais.';
    END IF;

    RETURN QUERY
    WITH RECURSIVE bom_tree AS (
        -- Anchor
        SELECT 
            b.article_id as parent_id,
            b.ref_id,
            b.ref_tipo,
            b.descricao,
            (p_quantidade_base * b.qtd_por_kg) as qty_liq,
            (p_quantidade_base * b.qtd_por_kg * (1 + COALESCE(b.fator_perda_pct, 0) / 100)) as qty_bru,
            1 as depth,
            ARRAY[b.id] as path
        FROM public.article_bom b
        WHERE b.article_id = p_article_id

        UNION ALL

        -- Recursion
        SELECT 
            bt.parent_id,
            b.ref_id,
            b.ref_tipo,
            b.descricao,
            (bt.qty_liq * b.qtd_por_kg) as qty_liq,
            (bt.qty_bru * b.qtd_por_kg * (1 + COALESCE(b.fator_perda_pct, 0) / 100)) as qty_bru,
            bt.depth + 1,
            bt.path || b.id
        FROM bom_tree bt
        JOIN public.article_bom b ON b.article_id = bt.ref_id
        WHERE bt.ref_tipo = 'artigo' 
          AND bt.depth < p_max_depth
          AND NOT (b.id = ANY(bt.path))
    ),
    aggregated AS (
        SELECT 
            bt.parent_id,
            bt.ref_id,
            bt.ref_tipo,
            bt.descricao,
            SUM(bt.qty_liq) as qty_liq,
            SUM(bt.qty_bru) as qty_bru,
            MAX(bt.depth) as depth,
            ARRAY_AGG(bt.path) as paths -- We aggregate paths to keep track but output the "best" level
        FROM bom_tree bt
        GROUP BY bt.parent_id, bt.ref_id, bt.ref_tipo, bt.descricao
    )
    SELECT 
        a.parent_id,
        a.ref_id,
        a.ref_tipo,
        a.descricao,
        art.codigo,
        art.unidade,
        a.depth,
        a.qty_liq,
        a.qty_bru,
        cost.cost_value,
        (a.qty_liq * cost.cost_value) as custo_liquido,
        ((a.qty_bru - a.qty_liq) * cost.cost_value) as custo_perda,
        (a.qty_bru * cost.cost_value) as custo_total_linha,
        cost.cost_source,
        cost.cost_date,
        CASE 
            WHEN cost.is_missing THEN 'SEM_CUSTO'
            WHEN cost.is_outdated THEN 'DESATUALIZADO'
            ELSE 'OK'
        END as status_custo,
        cost.is_missing,
        cost.is_outdated,
        (a.paths[1]) -- Just first path for hierarchy visualization
    FROM aggregated a
    LEFT JOIN public.articles art ON art.id = a.ref_id AND a.ref_tipo = 'artigo'
    LEFT JOIN LATERAL public.get_best_article_cost(a.ref_id) cost ON a.ref_tipo = 'artigo'
    ORDER BY a.depth, art.codigo;
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.explode_bom_cost(uuid, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.explode_bom_cost(uuid, numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.explode_bom_cost(uuid, numeric, integer) TO service_role;

REVOKE ALL ON FUNCTION public.get_best_article_cost(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_best_article_cost(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_article_cost(uuid) TO service_role;
