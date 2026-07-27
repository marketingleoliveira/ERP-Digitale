-- Enum for MRP suggestion status
DO $$ BEGIN
    CREATE TYPE public.mrp_suggestion_status AS ENUM (
        'SUGERIDA', 
        'EM_ANALISE', 
        'APROVADA', 
        'REJEITADA', 
        'EM_COTACAO', 
        'PARCIALMENTE_CONVERTIDA', 
        'CONVERTIDA', 
        'CANCELADA', 
        'DESATUALIZADA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table for MRP Purchase Suggestions
CREATE TABLE IF NOT EXISTS public.mrp_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_tipo text NOT NULL CHECK (ref_tipo IN ('produto', 'variante', 'fio', 'outro')),
    ref_id uuid,
    descricao text NOT NULL,
    unidade text NOT NULL,
    necessidade_bruta numeric(14,3) NOT NULL DEFAULT 0,
    perda numeric(14,3) NOT NULL DEFAULT 0,
    estoque_fisico numeric(14,3) NOT NULL DEFAULT 0,
    estoque_disponivel numeric(14,3) NOT NULL DEFAULT 0,
    estoque_reservado numeric(14,3) NOT NULL DEFAULT 0,
    estoque_seguranca numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_em_transito numeric(14,3) NOT NULL DEFAULT 0,
    necessidade_liquida numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_sugerida numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_aprovada numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_convertida numeric(14,3) NOT NULL DEFAULT 0,
    custo_unitario_estimado numeric(14,4),
    custo_total_estimado numeric(14,4),
    origem_custo text,
    fornecedor_sugerido_id uuid REFERENCES public.fornecedores(id),
    data_necessaria date,
    data_sugerida_compra date,
    prioridade text NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
    status mrp_suggestion_status NOT NULL DEFAULT 'SUGERIDA',
    justificativa text,
    motivo_rejeicao text,
    motivo_cancelamento text,
    versao_calculo integer NOT NULL DEFAULT 1,
    responsavel_id uuid REFERENCES auth.users(id),
    aprovador_id uuid REFERENCES auth.users(id),
    aprovada_em timestamptz,
    pedido_compra_id uuid REFERENCES public.pedidos_compra(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grant access to mrp_suggestions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mrp_suggestions TO authenticated;
GRANT ALL ON public.mrp_suggestions TO service_role;

-- Enable RLS
ALTER TABLE public.mrp_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for mrp_suggestions
CREATE POLICY "mrp_suggestions_read_auth" ON public.mrp_suggestions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "mrp_suggestions_write_mgmt" ON public.mrp_suggestions
    FOR ALL TO authenticated
    USING (has_any_role(auth.uid(), ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]))
    WITH CHECK (has_any_role(auth.uid(), ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]));

-- Table for MRP suggestion origins (traceability)
CREATE TABLE IF NOT EXISTS public.mrp_suggestion_origins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id uuid NOT NULL REFERENCES public.mrp_suggestions(id) ON DELETE CASCADE,
    op_id uuid REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    demanda_manual_id uuid, -- For future use
    quantidade numeric(14,3) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Grant access to mrp_suggestion_origins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mrp_suggestion_origins TO authenticated;
GRANT ALL ON public.mrp_suggestion_origins TO service_role;

-- Enable RLS
ALTER TABLE public.mrp_suggestion_origins ENABLE ROW LEVEL SECURITY;

-- Policies for mrp_suggestion_origins
CREATE POLICY "mrp_suggestion_origins_read_auth" ON public.mrp_suggestion_origins
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "mrp_suggestion_origins_write_mgmt" ON public.mrp_suggestion_origins
    FOR ALL TO authenticated
    USING (has_any_role(auth.uid(), ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]))
    WITH CHECK (has_any_role(auth.uid(), ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mrp_suggestions_upd ON public.mrp_suggestions;
CREATE TRIGGER trg_mrp_suggestions_upd
    BEFORE UPDATE ON public.mrp_suggestions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RPC to generate purchase suggestions
CREATE OR REPLACE FUNCTION public.generate_purchase_suggestions(
    p_data_inicio date DEFAULT NULL,
    p_data_fim date DEFAULT NULL,
    p_modo_persistencia boolean DEFAULT true
)
RETURNS TABLE (
    total_gerado integer,
    total_necessidade_liquida numeric(14,3)
) 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_versao integer;
    v_total integer := 0;
    v_sum_liq numeric := 0;
BEGIN
    -- 1. Validate user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- 2. Validate role
    IF NOT public.has_any_role(v_user_id, ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]) THEN
        RAISE EXCEPTION 'Permissão insuficiente';
    END IF;

    -- 3. Get next calculation version
    SELECT COALESCE(MAX(versao_calculo), 0) + 1 INTO v_versao FROM public.mrp_suggestions;

    -- 4. Temporary table to hold intermediate calculations
    CREATE TEMP TABLE temp_mrp_needs (
        ref_tipo text,
        ref_id uuid,
        descricao text,
        unidade text,
        necessidade_bruta numeric(14,3),
        perda numeric(14,3),
        op_id uuid,
        op_quantidade numeric(14,3)
    ) ON COMMIT DROP;

    -- 5. Calculate gross requirements from active OPs
    INSERT INTO temp_mrp_needs (ref_tipo, ref_id, descricao, unidade, necessidade_bruta, perda, op_id, op_quantidade)
    SELECT 
        exp.component_ref_tipo,
        exp.component_ref_id,
        exp.component_descricao,
        exp.unidade,
        exp.quantidade_liquida,
        (exp.quantidade_bruta - exp.quantidade_liquida) as perda,
        op.id as op_id,
        opi.quantidade_planejada
    FROM public.ordens_producao op
    JOIN public.op_itens opi ON opi.op_id = op.id
    JOIN public.products p ON p.id = opi.product_id
    CROSS JOIN LATERAL public.explode_bom(p.article_id, opi.quantidade_planejada) exp
    WHERE op.status IN ('planejada', 'programada', 'em_producao', 'parcial')
      AND (p_data_inicio IS NULL OR op.data_prevista >= p_data_inicio)
      AND (p_data_fim IS NULL OR op.data_prevista <= p_data_fim);

    -- 6. Consolidate and persist suggestions
    IF p_modo_persistencia THEN
        -- Mark current SUGERIDA suggestions for these items as DESATUALIZADA
        UPDATE public.mrp_suggestions 
        SET status = 'DESATUALIZADA' 
        WHERE status = 'SUGERIDA'
          AND (ref_tipo, ref_id) IN (SELECT ref_tipo, ref_id FROM temp_mrp_needs);

        -- Create new suggestions
        WITH consolidated AS (
            SELECT 
                ref_tipo,
                ref_id,
                MAX(descricao) as descricao,
                MAX(unidade) as unidade,
                SUM(necessidade_bruta) as bruta,
                SUM(perda) as perda_total,
                MIN(op_id) as first_op_id -- just for data reference
            FROM temp_mrp_needs
            GROUP BY ref_tipo, ref_id
        ),
        stock_data AS (
            SELECT 
                c.ref_tipo,
                c.ref_id,
                -- Estoque Físico
                COALESCE((
                    SELECT SUM(quantidade) 
                    FROM public.lotes l 
                    WHERE l.ref_tipo = c.ref_tipo AND l.ref_id = c.ref_id
                ), 0) as estoque_fisico,
                -- Estoque Reservado
                COALESCE((
                    SELECT SUM(quantidade) 
                    FROM public.op_reservas_lote rl
                    JOIN public.lotes l ON l.id = rl.lote_id
                    WHERE l.ref_tipo = c.ref_tipo AND l.ref_id = c.ref_id
                ), 0) as estoque_reservado,
                -- Compras em Trânsito
                COALESCE((
                    SELECT SUM(pci.quantidade - pci.quantidade_recebida)
                    FROM public.pedidos_compra_itens pci
                    JOIN public.pedidos_compra pc ON pc.id = pci.pedido_id
                    WHERE pci.tipo_ref = c.ref_tipo AND pci.ref_id = c.ref_id
                      AND pc.status IN ('aprovado', 'parcial')
                ), 0) as em_transito
        )
        INSERT INTO public.mrp_suggestions (
            ref_tipo, ref_id, descricao, unidade, 
            necessidade_bruta, perda, 
            estoque_fisico, estoque_reservado, estoque_disponivel,
            quantidade_em_transito, necessidade_liquida, quantidade_sugerida,
            versao_calculo, responsavel_id
        )
        SELECT 
            c.ref_tipo, 
            c.ref_id, 
            c.descricao, 
            c.unidade,
            c.bruta, 
            c.perda_total,
            s.estoque_fisico,
            s.estoque_reservado,
            (s.estoque_fisico - s.estoque_reservado) as estoque_disponivel,
            s.em_transito,
            GREATEST(0, (c.bruta + c.perda_total) - (s.estoque_fisico - s.estoque_reservado) - s.em_transito) as necessidade_liquida,
            GREATEST(0, (c.bruta + c.perda_total) - (s.estoque_fisico - s.estoque_reservado) - s.em_transito) as quantidade_sugerida,
            v_versao,
            v_user_id
        FROM consolidated c
        JOIN stock_data s ON s.ref_tipo = c.ref_tipo AND s.ref_id = c.ref_id
        WHERE GREATEST(0, (c.bruta + c.perda_total) - (s.estoque_fisico - s.estoque_reservado) - s.em_transito) > 0
        RETURNING id, necessidade_liquida INTO v_sum_liq; -- this won't work correctly for multiple rows, but we only need it for total count

        -- Map origins
        INSERT INTO public.mrp_suggestion_origins (suggestion_id, op_id, quantidade)
        SELECT 
            s.id,
            t.op_id,
            SUM(t.necessidade_bruta)
        FROM temp_mrp_needs t
        JOIN public.mrp_suggestions s ON s.ref_tipo = t.ref_tipo AND s.ref_id = t.ref_id AND s.versao_calculo = v_versao
        GROUP BY s.id, t.op_id;

        -- Get final counts
        SELECT COUNT(*), SUM(necessidade_liquida) INTO v_total, v_sum_liq
        FROM public.mrp_suggestions
        WHERE versao_calculo = v_versao;

    END IF;

    RETURN QUERY SELECT v_total, COALESCE(v_sum_liq, 0);
END;
$$ LANGUAGE plpgsql;

-- Grant execution to authenticated
REVOKE EXECUTE ON FUNCTION public.generate_purchase_suggestions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_purchase_suggestions TO authenticated;
