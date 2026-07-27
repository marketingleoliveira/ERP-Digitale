-- Migration: Reserva Transacional de Materiais por OP
-- Descrição: Implementa a tabela de reservas e a lógica de compromisso de saldo sem baixa física imediata.

-- 1. Tabela de Reservas
CREATE TABLE IF NOT EXISTS public.reservas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    op_id uuid REFERENCES public.ordens_producao(id) ON DELETE CASCADE NOT NULL,
    item_id uuid REFERENCES public.produtos(id) NOT NULL,
    lote_id uuid REFERENCES public.lotes(id), -- Opcional: reserva pode ser genérica ou por lote
    quantidade numeric(18,4) NOT NULL CHECK (quantidade > 0),
    status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'consumida', 'cancelada')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reservas_op ON public.reservas(op_id);
CREATE INDEX IF NOT EXISTS idx_reservas_item ON public.reservas(item_id);
CREATE INDEX IF NOT EXISTS idx_reservas_lote ON public.reservas(lote_id);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;

-- RLS
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver todas as reservas"
ON public.reservas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operadores e admins podem gerenciar reservas"
ON public.reservas FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'producao') OR public.has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'producao') OR public.has_role(auth.uid(), 'desenvolvedor'));

-- 2. RPC para Reserva Transacional
CREATE OR REPLACE FUNCTION public.reserve_material_for_op(
    p_op_id uuid,
    p_item_id uuid,
    p_quantidade numeric,
    p_lote_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reserva_id uuid;
    v_saldo_disponivel numeric;
BEGIN
    -- Bloqueio pessimista para evitar concorrência no saldo
    -- Se p_lote_id for informado, verifica o lote. Senão, verifica o saldo geral do item.
    IF p_lote_id IS NOT NULL THEN
        SELECT quantidade_disponivel INTO v_saldo_disponivel
        FROM public.lotes
        WHERE id = p_lote_id
        FOR UPDATE;
        
        IF v_saldo_disponivel < p_quantidade THEN
            RAISE EXCEPTION 'Saldo insuficiente no lote: disponível %, necessário %', v_saldo_disponivel, p_quantidade;
        END IF;

        -- Atualiza saldo disponível do lote (compromisso)
        UPDATE public.lotes 
        SET quantidade_disponivel = quantidade_disponivel - p_quantidade,
            updated_at = now()
        WHERE id = p_lote_id;
    ELSE
        -- Reserva genérica por item (busca lotes FIFO se necessário ou apenas registra a intenção)
        -- Para esta implementação técnica, exigiremos vínculo com lote para garantir a rastreabilidade pedida.
        RAISE EXCEPTION 'Para garantir a rastreabilidade da Etapa 5, a reserva deve ser vinculada a um lote específico.';
    END IF;

    -- Registra a reserva
    INSERT INTO public.reservas (op_id, item_id, lote_id, quantidade, created_by)
    VALUES (p_op_id, p_item_id, p_lote_id, p_quantidade, auth.uid())
    RETURNING id INTO v_reserva_id;

    RETURN v_reserva_id;
END;
$$;

-- 3. RPC para Cancelamento de Reserva
CREATE OR REPLACE FUNCTION public.cancel_material_reservation(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lote_id uuid;
    v_quantidade numeric;
BEGIN
    -- Busca dados da reserva e bloqueia
    SELECT lote_id, quantidade INTO v_lote_id, v_quantidade
    FROM public.reservas
    WHERE id = p_reserva_id AND status = 'ativa'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva não encontrada ou já processada.';
    END IF;

    -- Devolve saldo ao lote
    IF v_lote_id IS NOT NULL THEN
        UPDATE public.lotes 
        SET quantidade_disponivel = quantidade_disponivel + v_quantidade,
            updated_at = now()
        WHERE id = v_lote_id;
    END IF;

    -- Marca como cancelada
    UPDATE public.reservas SET status = 'cancelada', updated_at = now() WHERE id = p_reserva_id;
END;
$$;

