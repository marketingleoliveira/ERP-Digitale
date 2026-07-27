
-- Migration for Reverse BOM (Where Used)
CREATE OR REPLACE FUNCTION public.where_used_bom(
    p_component_ref_id UUID,
    p_max_depth INTEGER DEFAULT 10,
    p_include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    searched_component_id UUID,
    parent_article_id UUID,
    final_article_id UUID,
    article_codigo TEXT,
    article_nome TEXT,
    nivel INTEGER,
    path_ids UUID[],
    path_names TEXT[],
    quantidade_no_vinculo NUMERIC,
    quantidade_acumulada NUMERIC,
    perda_percentual NUMERIC,
    artigo_status BOOLEAN,
    vinculo_status BOOLEAN, -- Placeholder se houver coluna de status no vinculo
    uso_tipo TEXT, -- 'Direto' ou 'Indireto'
    has_cycle BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE where_used AS (
        -- Base: Onde o componente é usado diretamente
        SELECT 
            b.article_id,
            b.article_id as final_id,
            a.codigo as art_codigo,
            a.nome as art_nome,
            1 as depth,
            ARRAY[b.article_id] as path,
            ARRAY[a.nome] as name_path,
            b.qtd_por_kg,
            b.qtd_por_kg as total_qty,
            COALESCE(b.fator_perda_pct, 0) as loss,
            a.ativo as art_ativo,
            'Direto'::TEXT as usage,
            FALSE as cycle
        FROM public.article_bom b
        JOIN public.articles a ON a.id = b.article_id
        WHERE b.ref_id = p_component_ref_id
        AND (p_include_inactive OR a.ativo = TRUE)

        UNION ALL

        -- Recursão: Subindo na árvore
        SELECT 
            b.article_id,
            wu.final_id,
            a.codigo,
            a.nome,
            wu.depth + 1,
            wu.path || b.article_id,
            wu.name_path || a.nome,
            b.qtd_por_kg,
            (wu.total_qty * b.qtd_por_kg),
            COALESCE(b.fator_perda_pct, 0),
            a.ativo,
            'Indireto'::TEXT,
            b.article_id = ANY(wu.path)
        FROM where_used wu
        JOIN public.article_bom b ON b.ref_id = wu.article_id
        JOIN public.articles a ON a.id = b.article_id
        WHERE wu.depth < p_max_depth
        AND NOT wu.cycle
        AND (p_include_inactive OR a.ativo = TRUE)
    )
    SELECT 
        p_component_ref_id,
        wu.article_id,
        wu.final_id,
        wu.art_codigo,
        wu.art_nome,
        wu.depth,
        wu.path,
        wu.name_path,
        wu.qtd_por_kg,
        wu.total_qty,
        wu.loss,
        wu.art_ativo,
        TRUE, -- vinculo_status (assumindo true pois não há coluna ativa na article_bom)
        wu.usage,
        wu.cycle
    FROM where_used wu;
END;
$$;

GRANT EXECUTE ON FUNCTION public.where_used_bom(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.where_used_bom(UUID, INTEGER, BOOLEAN) TO service_role;
REVOKE ALL ON FUNCTION public.where_used_bom(UUID, INTEGER, BOOLEAN) FROM PUBLIC;
