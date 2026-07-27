-- Adição de chave de idempotência para garantir conversão única
ALTER TABLE public.pedidos_compra ADD COLUMN IF NOT EXISTS idempotency_key uuid UNIQUE;

-- Recriação da RPC com suporte a idempotência e correção de nomes de tabelas/colunas
CREATE OR REPLACE FUNCTION public.convert_mrp_suggestions_to_order(
    p_suggestion_ids uuid[], 
    p_fornecedor_id uuid, 
    p_condicao_pagamento text DEFAULT NULL, 
    p_prazo_entrega date DEFAULT NULL,
    p_idempotency_key uuid DEFAULT NULL
)
RETURNS public.pedidos_compra
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_user_id uuid;
    v_pedido public.pedidos_compra;
    v_sid uuid;
    v_sug public.mrp_suggestions;
    v_total numeric := 0;
    v_qty_to_convert numeric;
    v_item_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Verificação de Idempotência
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_pedido FROM public.pedidos_compra WHERE idempotency_key = p_idempotency_key;
        IF v_pedido.id IS NOT NULL THEN
            RETURN v_pedido;
        END IF;
    END IF;

    -- RBAC check
    IF NOT public.has_any_role(v_user_id, ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]) THEN
        RAISE EXCEPTION 'Permissão insuficiente para converter sugestões';
    END IF;

    -- 1. Criar Cabeçalho do Pedido
    INSERT INTO public.pedidos_compra (
        fornecedor_id, 
        condicao_pagamento, 
        prazo_entrega, 
        status, 
        criado_por, 
        valor_total,
        idempotency_key
    )
    VALUES (
        p_fornecedor_id, 
        p_condicao_pagamento, 
        p_prazo_entrega, 
        'rascunho', 
        v_user_id, 
        0,
        p_idempotency_key
    )
    RETURNING * INTO v_pedido;

    -- 2. Processar itens
    FOREACH v_sid IN ARRAY p_suggestion_ids LOOP
        SELECT * INTO v_sug FROM public.mrp_suggestions WHERE id = v_sid FOR UPDATE;

        IF v_sug.id IS NULL OR v_sug.status NOT IN ('APROVADA', 'PARCIALMENTE_CONVERTIDA') THEN
            CONTINUE; -- Ou RAISE conforme política
        END IF;

        v_qty_to_convert := v_sug.quantidade_aprovada - v_sug.quantidade_convertida;

        IF v_qty_to_convert <= 0 THEN
            CONTINUE;
        END IF;

        -- Inserção no item (Tabelas: pedidos_compra_itens ou itens_pedido_compra)
        BEGIN
            INSERT INTO public.pedidos_compra_itens (
                pedido_id, tipo_ref, ref_id, descricao, quantidade, unidade, preco_unitario
            ) VALUES (
                v_pedido.id, v_sug.ref_tipo, v_sug.ref_id, v_sug.descricao, v_qty_to_convert, v_sug.unidade, COALESCE(v_sug.custo_unitario_estimado, 0)
            ) RETURNING id INTO v_item_id;
        EXCEPTION WHEN undefined_table THEN
            INSERT INTO public.itens_pedido_compra (
                pedido_id, ref_tipo, ref_id, descricao, quantidade, unidade, preco_unitario
            ) VALUES (
                v_pedido.id, v_sug.ref_tipo, v_sug.ref_id, v_sug.descricao, v_qty_to_convert, v_sug.unidade, COALESCE(v_sug.custo_unitario_estimado, 0)
            ) RETURNING id INTO v_item_id;
        END;

        v_total := v_total + (v_qty_to_convert * COALESCE(v_sug.custo_unitario_estimado, 0));

        -- Vínculo e Auditoria
        INSERT INTO public.mrp_suggestion_orders (suggestion_id, purchase_order_id, purchase_order_item_id, quantity_converted, created_by)
        VALUES (v_sid, v_pedido.id, v_item_id, v_qty_to_convert, v_user_id);

        UPDATE public.mrp_suggestions
        SET status = 'CONVERTIDA',
            quantidade_convertida = quantidade_aprovada,
            pedido_compra_id = v_pedido.id,
            updated_at = now()
        WHERE id = v_sid;
    END LOOP;

    -- Atualizar Total do Pedido
    UPDATE public.pedidos_compra SET valor_total = v_total WHERE id = v_pedido.id RETURNING * INTO v_pedido;

    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, description)
    VALUES (v_user_id, 'pedidos_compra', v_pedido.id, 'CONVERSION', 'Pedido gerado via MRP');

    RETURN v_pedido;
END;
$$;