-- ETAPA 10: RPCs COMERCIAIS E LOGÍSTICAS

-- 1. Simulação de Reserva
CREATE OR REPLACE FUNCTION public.simulate_sales_order_reservation(
    p_pedido_id uuid,
    p_deposito text DEFAULT NULL,
    p_politica text DEFAULT 'FIFO' -- FIFO, FEFO
)
RETURNS TABLE (
    pedido_item_id uuid,
    artigo_id uuid,
    variante_id uuid,
    cor_id uuid,
    quantidade_solicitada numeric,
    quantidade_atendida numeric,
    lotes_sugeridos jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH itens AS (
        SELECT 
            pi.id,
            pi.artigo_id,
            pi.variante_id,
            pi.cor_id,
            pi.quantidade - COALESCE(pi.quantidade_reservada, 0) as pendente
        FROM public.pedido_itens pi
        WHERE pi.pedido_id = p_pedido_id
        AND pi.quantidade > COALESCE(pi.quantidade_reservada, 0)
    ),
    lotes_elegiveis AS (
        SELECT 
            l.id as lote_id,
            l.item_id,
            l.numero_lote,
            l.quantidade_disponivel - l.saldo_reservado_comercial as livre,
            l.data_entrada,
            l.data_entrada as data_vencimento -- Simplificado
        FROM public.lotes l
        WHERE l.liberado_comercial = true
        AND l.habilitado = true
        AND (p_deposito IS NULL OR l.deposito = p_deposito)
        AND l.quantidade_disponivel > l.saldo_reservado_comercial
    )
    SELECT 
        i.id,
        i.artigo_id,
        i.variante_id,
        i.cor_id,
        i.pendente,
        LEAST(i.pendente, SUM(le.livre) OVER (PARTITION BY i.id)),
        jsonb_agg(jsonb_build_object('lote_id', le.lote_id, 'numero_lote', le.numero_lote, 'quantidade', le.livre))
    FROM itens i
    LEFT JOIN lotes_elegiveis le ON le.item_id = i.artigo_id
    GROUP BY i.id, i.artigo_id, i.variante_id, i.cor_id, i.pendente;
END;
$$;

-- 2. Reserva Transacional
CREATE OR REPLACE FUNCTION public.reserve_stock_for_sales_order(
    p_pedido_id uuid,
    p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item record;
    v_lote record;
    v_atendido numeric;
    v_qtd_a_reservar numeric;
    v_total_reservado numeric := 0;
BEGIN
    -- Check idempotency
    IF EXISTS (SELECT 1 FROM public.pedidos WHERE idempotency_key = p_idempotency_key) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already processed');
    END IF;

    -- Lock pedido
    UPDATE public.pedidos SET idempotency_key = p_idempotency_key WHERE id = p_pedido_id;

    FOR v_item IN (SELECT * FROM public.pedido_itens WHERE pedido_id = p_pedido_id) LOOP
        v_qtd_a_reservar := v_item.quantidade - COALESCE(v_item.quantidade_reservada, 0);
        
        IF v_qtd_a_reservar <= 0 THEN CONTINUE; END IF;

        FOR v_lote IN (
            SELECT * FROM public.lotes 
            WHERE item_id = v_item.artigo_id 
            AND liberado_comercial = true 
            AND habilitado = true
            AND quantidade_disponivel > saldo_reservado_comercial
            ORDER BY data_entrada ASC -- FIFO default
            FOR UPDATE SKIP LOCKED
        ) LOOP
            v_atendido := LEAST(v_qtd_a_reservar, v_lote.quantidade_disponivel - v_lote.saldo_reservado_comercial);
            
            IF v_atendido > 0 THEN
                -- Create reservation record
                INSERT INTO public.vendas_reservas (pedido_id, pedido_item_id, lote_id, quantidade, status)
                VALUES (p_pedido_id, v_item.id, v_lote.id, v_atendido, 'ativa');

                -- Update lot balances
                UPDATE public.lotes 
                SET saldo_reservado_comercial = saldo_reservado_comercial + v_atendido 
                WHERE id = v_lote.id;

                -- Update item balances
                UPDATE public.pedido_itens 
                SET quantidade_reservada = quantidade_reservada + v_atendido 
                WHERE id = v_item.id;

                v_qtd_a_reservar := v_qtd_a_reservar - v_atendido;
                v_total_reservado := v_total_reservado + v_atendido;
            END IF;

            EXIT WHEN v_qtd_a_reservar <= 0;
        END LOOP;
    END LOOP;

    -- Update pedido status
    UPDATE public.pedidos 
    SET status = CASE 
        WHEN (SELECT SUM(quantidade - quantidade_reservada) FROM public.pedido_itens WHERE pedido_id = p_pedido_id) <= 0 THEN 'reservado'
        ELSE 'reserva_parcial'
    END
    WHERE id = p_pedido_id;

    RETURN jsonb_build_object('success', true, 'total_reservado', v_total_reservado);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro na reserva: %', SQLERRM;
END;
$$;

-- 3. Expedição (Baixa Física)
CREATE OR REPLACE FUNCTION public.ship_sales_order(
    p_pedido_id uuid,
    p_expedicao_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_reserva record;
BEGIN
    -- For each active reservation of this order
    FOR v_reserva IN (
        SELECT * FROM public.vendas_reservas 
        WHERE pedido_id = p_pedido_id AND status = 'ativa'
    ) LOOP
        -- Physical reduction
        UPDATE public.lotes 
        SET 
            quantidade = quantidade - v_reserva.quantidade,
            quantidade_disponivel = quantidade_disponivel - v_reserva.quantidade,
            saldo_reservado_comercial = saldo_reservado_comercial - v_reserva.quantidade
        WHERE id = v_reserva.lote_id;

        -- Update order item
        UPDATE public.pedido_itens 
        SET 
            quantidade_expedida = quantidade_expedida + v_reserva.quantidade,
            quantidade_reservada = quantidade_reservada - v_reserva.quantidade
        WHERE id = v_reserva.pedido_item_id;

        -- Mark reservation as consumed
        UPDATE public.vendas_reservas SET status = 'consumida' WHERE id = v_reserva.id;
    END LOOP;

    -- Update order status
    UPDATE public.pedidos SET status = 'expedido' WHERE id = p_pedido_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_sales_order_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_stock_for_sales_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.ship_sales_order TO authenticated;
