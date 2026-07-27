-- RPC to approve MRP suggestion
CREATE OR REPLACE FUNCTION public.approve_mrp_suggestion(
    p_suggestion_id uuid,
    p_quantidade_aprovada numeric,
    p_justificativa text DEFAULT NULL
)
RETURNS public.mrp_suggestions
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_suggestion public.mrp_suggestions;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    IF NOT public.has_any_role(v_user_id, ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]) THEN
        RAISE EXCEPTION 'Permissão insuficiente';
    END IF;

    SELECT * INTO v_suggestion FROM public.mrp_suggestions WHERE id = p_suggestion_id FOR UPDATE;

    IF v_suggestion.id IS NULL THEN
        RAISE EXCEPTION 'Sugestão não encontrada';
    END IF;

    IF v_suggestion.status NOT IN ('SUGERIDA', 'EM_ANALISE', 'DESATUALIZADA') THEN
        RAISE EXCEPTION 'Status atual não permite aprovação (%)', v_suggestion.status;
    END IF;

    UPDATE public.mrp_suggestions
    SET status = 'APROVADA',
        quantidade_aprovada = p_quantidade_aprovada,
        justificativa = COALESCE(p_justificativa, justificativa),
        aprovador_id = v_user_id,
        aprovada_em = now()
    WHERE id = p_suggestion_id
    RETURNING * INTO v_suggestion;

    -- Log audit
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, description)
    VALUES (v_user_id, 'mrp_suggestions', p_suggestion_id, 'UPDATE', 'MRP Suggestion Approved: Qty ' || p_quantidade_aprovada);

    RETURN v_suggestion;
END;
$$ LANGUAGE plpgsql;

-- RPC to convert approved MRP suggestions to Purchase Order
CREATE OR REPLACE FUNCTION public.convert_mrp_suggestions_to_order(
    p_suggestion_ids uuid[],
    p_fornecedor_id uuid,
    p_condicao_pagamento text DEFAULT NULL,
    p_prazo_entrega date DEFAULT NULL
)
RETURNS public.pedidos_compra
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_pedido public.pedidos_compra;
    v_sid uuid;
    v_sug public.mrp_suggestions;
    v_total numeric := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    IF NOT public.has_any_role(v_user_id, ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]) THEN
        RAISE EXCEPTION 'Permissão insuficiente';
    END IF;

    -- 1. Create Purchase Order
    INSERT INTO public.pedidos_compra (
        fornecedor_id, 
        condicao_pagamento, 
        prazo_entrega, 
        status, 
        criado_por, 
        valor_total
    )
    VALUES (
        p_fornecedor_id, 
        p_condicao_pagamento, 
        p_prazo_entrega, 
        'rascunho', 
        v_user_id, 
        0
    )
    RETURNING * INTO v_pedido;

    -- 2. Add items from suggestions
    FOREACH v_sid IN ARRAY p_suggestion_ids LOOP
        SELECT * INTO v_sug FROM public.mrp_suggestions WHERE id = v_sid FOR UPDATE;

        IF v_sug.id IS NULL OR v_sug.status != 'APROVADA' THEN
            RAISE EXCEPTION 'Sugestão % não encontrada ou não está aprovada', v_sid;
        END IF;

        IF v_sug.quantidade_aprovada <= v_sug.quantidade_convertida THEN
            RAISE EXCEPTION 'Sugestão % já foi totalmente convertida', v_sid;
        END IF;

        -- Create PO item
        INSERT INTO public.pedidos_compra_itens (
            pedido_id, 
            tipo_ref, 
            ref_id, 
            descricao, 
            quantidade, 
            unidade, 
            preco_unitario
        )
        VALUES (
            v_pedido.id, 
            v_sug.ref_tipo, 
            v_sug.ref_id, 
            v_sug.descricao, 
            (v_sug.quantidade_aprovada - v_sug.quantidade_convertida), 
            v_sug.unidade, 
            COALESCE(v_sug.custo_unitario_estimado, 0)
        );

        v_total := v_total + ((v_sug.quantidade_aprovada - v_sug.quantidade_convertida) * COALESCE(v_sug.custo_unitario_estimado, 0));

        -- Update suggestion
        UPDATE public.mrp_suggestions
        SET status = 'CONVERTIDA',
            quantidade_convertida = quantidade_aprovada,
            pedido_compra_id = v_pedido.id
        WHERE id = v_sid;
    END LOOP;

    -- 3. Update PO total
    UPDATE public.pedidos_compra SET valor_total = v_total WHERE id = v_pedido.id RETURNING * INTO v_pedido;

    -- Log audit
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, description)
    VALUES (v_user_id, 'pedidos_compra', v_pedido.id, 'INSERT', 'MRP Suggestions converted to PO');

    RETURN v_pedido;
END;
$$ LANGUAGE plpgsql;

-- Grant execution to authenticated
GRANT EXECUTE ON FUNCTION public.approve_mrp_suggestion TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_mrp_suggestions_to_order TO authenticated;
