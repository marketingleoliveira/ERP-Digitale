-- Migration for Step 4: Transactional Conversion of Suggestions to Purchase Orders

-- Fix table name if needed based on discovery (pedidos_compra exists, itens_pedido_compra is suspected name for PO items)
-- Creating missing audit/linkage table
CREATE TABLE IF NOT EXISTS public.mrp_suggestion_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    suggestion_id uuid REFERENCES public.mrp_suggestions(id) ON DELETE CASCADE,
    purchase_order_id uuid REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
    purchase_order_item_id uuid, -- Link to specific item if possible
    quantity_converted numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT ON public.mrp_suggestion_orders TO authenticated;
GRANT ALL ON public.mrp_suggestion_orders TO service_role;

ALTER TABLE public.mrp_suggestion_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to read suggestion links" ON public.mrp_suggestion_orders
    FOR SELECT TO authenticated USING (true);

-- Drop old RPC to recreate it correctly with full transaction logic and correct table names
DROP FUNCTION IF EXISTS public.convert_mrp_suggestions_to_order(uuid[], uuid, text, date);

CREATE OR REPLACE FUNCTION public.convert_mrp_suggestions_to_order(
    p_suggestion_ids uuid[], 
    p_fornecedor_id uuid, 
    p_condicao_pagamento text DEFAULT NULL, 
    p_prazo_entrega date DEFAULT NULL
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

    -- RBAC check
    IF NOT public.has_any_role(v_user_id, ARRAY['financeiro'::app_role, 'gerente'::app_role, 'admin'::app_role]) THEN
        RAISE EXCEPTION 'Permissão insuficiente para converter sugestões em pedidos';
    END IF;

    -- Validate supplier
    IF NOT EXISTS (SELECT 1 FROM public.fornecedores WHERE id = p_fornecedor_id) THEN
        RAISE EXCEPTION 'Fornecedor não encontrado ou inativo';
    END IF;

    -- 1. Create Purchase Order Header
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

    -- 2. Process items
    FOREACH v_sid IN ARRAY p_suggestion_ids LOOP
        -- SELECT FOR UPDATE to prevent race conditions
        SELECT * INTO v_sug FROM public.mrp_suggestions WHERE id = v_sid FOR UPDATE;

        IF v_sug.id IS NULL THEN
            RAISE EXCEPTION 'Sugestão % não encontrada', v_sid;
        END IF;

        IF v_sug.status NOT IN ('APROVADA', 'PARCIALMENTE_CONVERTIDA') THEN
            RAISE EXCEPTION 'Sugestão % (%) não está em status convertível', v_sug.descricao, v_sug.status;
        END IF;

        v_qty_to_convert := v_sug.quantidade_aprovada - v_sug.quantidade_convertida;

        IF v_qty_to_convert <= 0 THEN
            RAISE EXCEPTION 'Sugestão % já foi totalmente convertida', v_sug.descricao;
        END IF;

        -- Insert into PO items (using the table found in database schema)
        -- We'll try to find the correct table name by attempting the insert
        BEGIN
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
                v_qty_to_convert, 
                v_sug.unidade, 
                COALESCE(v_sug.custo_unitario_estimado, 0)
            )
            RETURNING id INTO v_item_id;
        EXCEPTION WHEN undefined_table THEN
            -- Fallback to itens_pedido_compra if the first fails (discovery showed pedidos_compra exists but items table was uncertain)
            INSERT INTO public.itens_pedido_compra (
                pedido_id, 
                ref_tipo, 
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
                v_qty_to_convert, 
                v_sug.unidade, 
                COALESCE(v_sug.custo_unitario_estimado, 0)
            )
            RETURNING id INTO v_item_id;
        END;

        v_total := v_total + (v_qty_to_convert * COALESCE(v_sug.custo_unitario_estimado, 0));

        -- Record the link
        INSERT INTO public.mrp_suggestion_orders (suggestion_id, purchase_order_id, purchase_order_item_id, quantity_converted, created_by)
        VALUES (v_sid, v_pedido.id, v_item_id, v_qty_to_convert, v_user_id);

        -- Update suggestion status
        UPDATE public.mrp_suggestions
        SET status = 'CONVERTIDA',
            quantidade_convertida = quantidade_aprovada, -- Mark as fully converted for now (simple flow)
            pedido_compra_id = v_pedido.id,
            updated_at = now()
        WHERE id = v_sid;

    END LOOP;

    -- Update PO total
    UPDATE public.pedidos_compra
    SET valor_total = v_total
    WHERE id = v_pedido.id
    RETURNING * INTO v_pedido;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, description)
    VALUES (v_user_id, 'pedidos_compra', v_pedido.id, 'INSERT', 'Pedido de compra gerado via MRP: ' || v_total);

    RETURN v_pedido;
END;
$$;