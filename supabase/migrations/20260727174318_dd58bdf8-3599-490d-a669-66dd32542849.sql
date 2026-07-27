-- Stage 6: Production Reporting and Controlled Consumption
-- Auditoria de Integridade e Modelagem de Apontamento/Consumo

-- 1. Normalização de Colunas e Constraints
ALTER TABLE public.ordens_producao 
ADD COLUMN IF NOT EXISTS quantidade_produzida numeric(18,4) DEFAULT 0 CHECK (quantidade_produzida >= 0);

ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS quantidade_consumida numeric(18,4) DEFAULT 0 CHECK (quantidade_consumida >= 0);

-- 2. Tabela de Tolerância de Consumo
CREATE TABLE IF NOT EXISTS public.config_tolerancia (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id text, -- Pode ser 'geral', 'material', 'artigo'
    ref_id uuid, -- ID do material ou artigo se categoria != 'geral'
    percentual_perda_tolerada numeric(5,2) DEFAULT 5.0,
    percentual_consumo_tolerado numeric(5,2) DEFAULT 10.0,
    exigir_justificativa_excesso boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.config_tolerancia TO authenticated;
GRANT ALL ON public.config_tolerancia TO service_role;
ALTER TABLE public.config_tolerancia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para autenticados" ON public.config_tolerancia FOR SELECT TO authenticated USING (true);

-- 3. Estrutura de Apontamento (Reforço)
-- Já existem op_apontamentos e op_consumos, vamos garantir que tenham idempotency_key
ALTER TABLE public.op_apontamentos ADD COLUMN IF NOT EXISTS idempotency_key uuid UNIQUE;
ALTER TABLE public.op_apontamentos ADD COLUMN IF NOT EXISTS etapa text;
ALTER TABLE public.op_apontamentos ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'estornado'));

ALTER TABLE public.op_consumos ADD COLUMN IF NOT EXISTS reserva_id uuid REFERENCES public.reservas(id);
ALTER TABLE public.op_consumos ADD COLUMN IF NOT EXISTS tipo_consumo text DEFAULT 'reserva' CHECK (tipo_consumo IN ('reserva', 'adicional', 'substituicao'));

-- 4. RPC de Simulação (Sem persistência)
CREATE OR REPLACE FUNCTION public.simulate_production_posting(
    p_op_id uuid,
    p_quantidade_boa numeric,
    p_consumos jsonb -- Array de {lote_id, quantidade, material_id}
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_item record;
    v_res record;
    v_retorno jsonb := '[]'::jsonb;
    v_teorico numeric;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_consumos) AS x(lote_id uuid, quantidade numeric, material_id uuid)
    LOOP
        -- Cálculo teórico (baseado na BOM do produto da OP - simplificado para este contexto)
        -- Aqui buscaríamos a BOM real, mas para a simulação retornamos o confronto com a reserva
        SELECT * INTO v_res FROM public.reservas 
        WHERE op_id = p_op_id AND lote_id = v_item.lote_id AND status = 'ativa';
        
        v_retorno := v_retorno || jsonb_build_object(
            'lote_id', v_item.lote_id,
            'material_id', v_item.material_id,
            'quantidade_informada', v_item.quantidade,
            'quantidade_reservada', COALESCE(v_res.quantidade - v_res.quantidade_consumida, 0),
            'divergencia', v_item.quantidade - COALESCE(v_res.quantidade - v_res.quantidade_consumida, 0)
        );
    END LOOP;
    
    RETURN jsonb_build_object('itens', v_retorno, 'op_id', p_op_id, 'producao_boa', p_quantidade_boa);
END;
$$;

-- 5. RPC Transacional de Apontamento e Consumo (O Motor Principal)
CREATE OR REPLACE FUNCTION public.post_production_consumption(
    p_op_id uuid,
    p_quantidade_produzida numeric,
    p_quantidade_refugo numeric,
    p_consumos jsonb, -- Array de {lote_id, quantidade, material_id, reserva_id}
    p_etapa text,
    p_maquina_id uuid DEFAULT NULL,
    p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_apontamento_id uuid;
    v_item record;
    v_op record;
    v_res record;
    v_lote record;
BEGIN
    -- 1. Idempotência
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_apontamento_id FROM public.op_apontamentos WHERE idempotency_key = p_idempotency_key;
        IF FOUND THEN
            RETURN jsonb_build_object('status', 'success', 'message', 'Já processado (idempotente)', 'id', v_apontamento_id);
        END IF;
    END IF;

    -- 2. Bloqueio e Validação da OP
    SELECT * INTO v_op FROM public.ordens_producao WHERE id = p_op_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'OP não encontrada'; END IF;
    IF v_op.status IN ('cancelada', 'encerrada') THEN RAISE EXCEPTION 'OP não permite apontamentos no status atual: %', v_op.status; END IF;

    -- 3. Criar Apontamento
    INSERT INTO public.op_apontamentos (
        op_id, quantidade_produzida, quantidade_refugo, etapa, maquina_id, idempotency_key, inicio
    ) VALUES (
        p_op_id, p_quantidade_produzida, p_quantidade_refugo, p_etapa, p_maquina_id, p_idempotency_key, now()
    ) RETURNING id INTO v_apontamento_id;

    -- 4. Processar Consumos
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_consumos) AS x(lote_id uuid, quantidade numeric, material_id uuid, reserva_id uuid)
    LOOP
        -- Bloqueio do Lote
        SELECT * INTO v_lote FROM public.lotes WHERE id = v_item.lote_id FOR UPDATE;
        IF v_lote.quantidade < v_item.quantidade THEN
            RAISE EXCEPTION 'Saldo físico insuficiente no lote %: disponível %, necessário %', v_lote.numero_lote, v_lote.quantidade, v_item.quantidade;
        END IF;

        -- Processar via Reserva
        IF v_item.reserva_id IS NOT NULL THEN
            SELECT * INTO v_res FROM public.reservas WHERE id = v_item.reserva_id FOR UPDATE;
            
            -- Se for reserva, o saldo já foi deduzido de quantidade_disponivel no momento da reserva.
            -- A baixa física deve deduzir de "quantidade" (físico).
            UPDATE public.lotes 
            SET quantidade = quantidade - v_item.quantidade,
                updated_at = now()
            WHERE id = v_item.lote_id;

            -- Atualizar Reserva
            UPDATE public.reservas 
            SET quantidade_consumida = quantidade_consumida + v_item.quantidade,
                status = CASE WHEN (quantidade_consumida + v_item.quantidade) >= quantidade THEN 'consumida' ELSE 'ativa' END,
                updated_at = now()
            WHERE id = v_item.reserva_id;
        ELSE
            -- Consumo sem reserva (Emergencial)
            -- Deduz tanto do físico quanto do disponível (já que não houve compromisso prévio)
            UPDATE public.lotes 
            SET quantidade = quantidade - v_item.quantidade,
                quantidade_disponivel = quantidade_disponivel - v_item.quantidade,
                updated_at = now()
            WHERE id = v_item.lote_id;
        END IF;

        -- Registrar Consumo Real
        INSERT INTO public.op_consumos (
            op_id, lote_id, quantidade, momento, user_id, reserva_id
        ) VALUES (
            p_op_id, v_item.lote_id, v_item.quantidade, now(), v_user_id, v_item.reserva_id
        );
    END LOOP;

    -- 5. Atualizar OP
    UPDATE public.ordens_producao 
    SET quantidade_produzida = COALESCE(quantidade_produzida, 0) + p_quantidade_produzida,
        status = 'em_producao',
        updated_at = now()
    WHERE id = p_op_id;

    -- 6. Auditoria / Evento
    INSERT INTO public.op_eventos (op_id, tipo, para_status, created_at)
    VALUES (p_op_id, 'apontamento_producao', 'em_producao', now());

    RETURN jsonb_build_object(
        'status', 'success',
        'apontamento_id', v_apontamento_id,
        'quantidade_total_produzida', v_op.quantidade_produzida + p_quantidade_produzida
    );
END;
$$;

-- 6. RPC para Estorno de Apontamento
CREATE OR REPLACE FUNCTION public.reverse_production_posting(p_apontamento_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_apt record;
    v_cons record;
BEGIN
    SELECT * INTO v_apt FROM public.op_apontamentos WHERE id = p_apontamento_id FOR UPDATE;
    IF v_apt.status = 'estornado' THEN RAISE EXCEPTION 'Apontamento já estornado'; END IF;

    -- Reverter consumos vinculados
    FOR v_cons IN SELECT * FROM public.op_consumos WHERE op_id = v_apt.op_id AND created_at >= v_apt.created_at LOOP
        -- Se tinha reserva, devolve apenas ao físico (o disponível já estava reservado ou sumiu)
        -- Aqui a lógica de negócio deve decidir se a reserva volta a ser ativa.
        IF v_cons.reserva_id IS NOT NULL THEN
            UPDATE public.lotes SET quantidade = quantidade + v_cons.quantidade WHERE id = v_cons.lote_id;
            UPDATE public.reservas 
            SET quantidade_consumida = quantidade_consumida - v_cons.quantidade,
                status = 'ativa'
            WHERE id = v_cons.reserva_id;
        ELSE
            -- Sem reserva: devolve físico e disponível
            UPDATE public.lotes 
            SET quantidade = quantidade + v_cons.quantidade,
                quantidade_disponivel = quantidade_disponivel + v_cons.quantidade 
            WHERE id = v_cons.lote_id;
        END IF;
    END LOOP;

    -- Atualizar OP
    UPDATE public.ordens_producao 
    SET quantidade_produzida = quantidade_produzida - v_apt.quantidade_produzida 
    WHERE id = v_apt.op_id;

    -- Marcar como estornado
    UPDATE public.op_apontamentos SET status = 'estornado', observacao = COALESCE(observacao, '') || ' [ESTORNO: ' || p_motivo || ']' WHERE id = p_apontamento_id;
    
    INSERT INTO public.op_eventos (op_id, tipo, created_at) VALUES (v_apt.op_id, 'estorno_apontamento', now());
END;
$$;

-- 7. Grants Finais
GRANT EXECUTE ON FUNCTION public.post_production_consumption TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_production_posting TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_production_posting TO authenticated;
