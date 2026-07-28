ALTER TABLE public.mes_events ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
ALTER TABLE public.mes_events ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

CREATE OR REPLACE FUNCTION public.process_mes_event(p_event_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_event mes_events%ROWTYPE;
    v_op_status op_status;
    v_open_apontamento_id uuid;
    v_tolerance numeric;
BEGIN
    -- Selecionar evento e travar para processamento
    SELECT * INTO v_event FROM mes_events WHERE id = p_event_id FOR UPDATE;
    
    IF v_event.id IS NULL OR v_event.status = 'processed' THEN
        RETURN;
    END IF;

    -- Auditoria inicial
    UPDATE mes_events SET status = 'processing' WHERE id = p_event_id;

    -- 1. Validar OP se informada
    IF v_event.op_id IS NOT NULL THEN
        SELECT status INTO v_op_status FROM ordens_producao WHERE id = v_event.op_id;
        IF v_op_status IN ('cancelada', 'finalizada') THEN
            RAISE EXCEPTION 'A Ordem de Produção % está com status % e não aceita novos apontamentos.', v_event.op_id, v_op_status;
        END IF;
    END IF;

    -- 2. Processamento por Tipo de Evento
    CASE v_event.event_type
        WHEN 'production_started' THEN
            -- Iniciar OP se estiver 'liberada'
            UPDATE ordens_producao 
            SET status = 'em_producao', 
                maquina_id = COALESCE(maquina_id, v_event.machine_id),
                funcionario_id = COALESCE(funcionario_id, v_event.operator_id)
            WHERE id = v_event.op_id AND status = 'liberada';

            -- Criar evento de histórico no ERP
            INSERT INTO op_eventos (op_id, tipo, de_status, para_status, payload, user_id)
            VALUES (v_event.op_id, 'MES_START', v_op_status, 'em_producao', v_event.payload, v_event.operator_id);

        WHEN 'production_paused' THEN
            -- Localizar apontamento aberto e encerrar
            UPDATE op_apontamentos 
            SET fim = v_event.occurred_at, 
                status = 'pausado',
                observacao = COALESCE(observacao, '') || ' [Pausa MES: ' || (v_event.payload->>'reason')::text || ']'
            WHERE op_id = v_event.op_id AND maquina_id = v_event.machine_id AND fim IS NULL;

        WHEN 'production_resumed' THEN
            -- Iniciar novo intervalo
            INSERT INTO op_apontamentos (op_id, funcionario_id, maquina_id, inicio, quantidade_produzida, quantidade_refugo, status)
            VALUES (v_event.op_id, v_event.operator_id, v_event.machine_id, v_event.occurred_at, 0, 0, 'em_producao');

        WHEN 'production_quantity_reported' THEN
            INSERT INTO op_apontamentos (
                op_id, funcionario_id, maquina_id, inicio, fim, 
                quantidade_produzida, idempotency_key, status
            ) VALUES (
                v_event.op_id, v_event.operator_id, v_event.machine_id, 
                v_event.occurred_at, v_event.occurred_at,
                (v_event.payload->>'quantity')::numeric, 
                v_event.event_id, 'concluido'
            ) ON CONFLICT (idempotency_key) DO NOTHING;

        WHEN 'production_loss_reported' THEN
            INSERT INTO op_apontamentos (
                op_id, funcionario_id, maquina_id, inicio, fim,
                quantidade_produzida, quantidade_refugo, motivo_refugo, 
                idempotency_key, status
            ) VALUES (
                v_event.op_id, v_event.operator_id, v_event.machine_id,
                v_event.occurred_at, v_event.occurred_at,
                0, (v_event.payload->>'quantity')::numeric,
                (v_event.payload->>'reason')::text,
                v_event.event_id, 'concluido'
            ) ON CONFLICT (idempotency_key) DO NOTHING;

        WHEN 'downtime_started' THEN
            INSERT INTO op_apontamentos (
                op_id, funcionario_id, maquina_id, inicio, 
                quantidade_produzida, status, observacao
            ) VALUES (
                v_event.op_id, v_event.operator_id, v_event.machine_id, 
                v_event.occurred_at, 0, 'parado',
                'PARADA MES: ' || (v_event.payload->>'reason')::text
            );

        WHEN 'downtime_finished' THEN
            UPDATE op_apontamentos 
            SET fim = v_event.occurred_at,
                status = 'concluido'
            WHERE op_id = v_event.op_id AND maquina_id = v_event.machine_id AND status = 'parado' AND fim IS NULL;

        WHEN 'production_finished' THEN
            UPDATE op_apontamentos SET fim = v_event.occurred_at WHERE op_id = v_event.op_id AND fim IS NULL;
            UPDATE ordens_producao SET status = 'finalizada', data_conclusao = v_event.occurred_at WHERE id = v_event.op_id;

        ELSE
            RAISE WARNING 'Tipo de evento MES desconhecido: %', v_event.event_type;
    END CASE;

    -- Finalizar processamento com sucesso
    UPDATE mes_events 
    SET status = 'processed', 
        processed_at = now(),
        error_message = NULL
    WHERE id = p_event_id;

EXCEPTION WHEN OTHERS THEN
    UPDATE mes_events 
    SET status = 'failed', 
        error_message = SQLERRM,
        retry_count = retry_count + 1,
        next_retry_at = now() + (interval '1 minute' * pow(2, retry_count))
    WHERE id = p_event_id;
    
    RAISE;
END;
$function$;