
-- RPC: Receber material de volta do terceiro
CREATE OR REPLACE FUNCTION public.receive_external_processing_return(
    p_remessa_id uuid,
    p_itens_retorno jsonb, -- [{remessa_item_id, quantidade_recebida, quantidade_perdida, artigo_resultante_id, numero_lote_novo}]
    p_documento_referencia text DEFAULT NULL,
    p_custo_servico numeric DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_retorno_id uuid;
    v_item record;
    v_remessa_item record;
    v_lote_origem record;
    v_lote_novo_id uuid;
    v_res jsonb;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

    -- Criar Cabeçalho do Retorno
    INSERT INTO public.retornos_terceiros (remessa_id, documento_referencia, custo_servico, user_id)
    VALUES (p_remessa_id, p_documento_referencia, p_custo_servico, v_user_id)
    RETURNING id INTO v_retorno_id;

    -- Processar itens
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens_retorno) LOOP
        -- Buscar item da remessa
        SELECT * INTO v_remessa_item FROM public.remessa_itens WHERE id = (v_item->>'remessa_item_id')::uuid FOR UPDATE;
        SELECT * INTO v_lote_origem FROM public.lotes WHERE id = v_remessa_item.lote_origem_id;

        -- Criar NOVO Lote (Material Processado)
        INSERT INTO public.lotes (
            numero_lote,
            item_id,
            item_tipo,
            quantidade,
            quantidade_disponivel,
            custo_unitario,
            deposito,
            status_processo,
            classificacao
        ) VALUES (
            COALESCE(v_item->>'numero_lote_novo', v_lote_origem.numero_lote || '-RET'),
            (v_item->>'artigo_resultante_id')::uuid,
            v_lote_origem.item_tipo,
            (v_item->>'quantidade_recebida')::numeric,
            (v_item->>'quantidade_recebida')::numeric,
            (v_lote_origem.custo_unitario + (p_custo_servico / (SELECT SUM((x->>'quantidade_recebida')::numeric) FROM jsonb_array_elements(p_itens_retorno) x))),
            'ESTOQUE-ACABADO', -- Depósito padrão para retorno
            'DISPONÍVEL',
            'PRIMEIRA'
        ) RETURNING id INTO v_lote_novo_id;

        -- Registrar Genealogia
        INSERT INTO public.lote_genealogia (lote_pai_id, lote_filho_id, tipo_relacao, quantidade_origem)
        VALUES (v_lote_origem.id, v_lote_novo_id, 'industrializacao', (v_item->>'quantidade_recebida')::numeric);

        -- Registrar Item do Retorno
        INSERT INTO public.retorno_itens (retorno_id, remessa_item_id, lote_resultante_id, quantidade_recebida, quantidade_perdida)
        VALUES (v_retorno_id, v_remessa_item.id, v_lote_novo_id, (v_item->>'quantidade_recebida')::numeric, (v_item->>'quantidade_perdida')::numeric);

        -- Atualizar Item da Remessa
        UPDATE public.remessa_itens 
        SET quantidade_retornada = quantidade_retornada + (v_item->>'quantidade_recebida')::numeric,
            quantidade_perdida = quantidade_perdida + (v_item->>'quantidade_perdida')::numeric
        WHERE id = v_remessa_item.id;

        -- Movimentação de Entrada (Kardex)
        INSERT INTO public.estoque_movimentos (tipo, operacao, lote_id, item_tipo, item_id, quantidade, saldo_anterior, saldo_posterior, user_id, observacao)
        VALUES ('transferencia', 'entrada', v_lote_novo_id, v_lote_origem.item_tipo, (v_item->>'artigo_resultante_id')::uuid, (v_item->>'quantidade_recebida')::numeric, 0, (v_item->>'quantidade_recebida')::numeric, v_user_id, 'Retorno de Terceiro');
    END LOOP;

    -- Verificar se a remessa foi concluída
    -- Se todos os itens foram retornados ou perdidos, marcar a ordem como RETORNADA
    UPDATE public.ordens_industrializacao
    SET status = 'RETORNADA'
    WHERE id = (SELECT ordem_id FROM public.remessas_terceiros WHERE id = p_remessa_id);

    RETURN jsonb_build_object('retorno_id', v_retorno_id, 'status', 'success');
END;
$$;

GRANT EXECUTE ON FUNCTION public.receive_external_processing_return(uuid, jsonb, text, numeric) TO authenticated;
