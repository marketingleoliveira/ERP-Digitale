
-- MIGRATION: Etapa 8 - Industrialização por Terceiros

-- 1. Enums e Tipos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ordem_industrializacao_status') THEN
        CREATE TYPE public.ordem_industrializacao_status AS ENUM (
            'RASCUNHO', 'APROVADA', 'AGUARDANDO-REMESSA', 'REMESSA-PARCIAL', 'REMETIDA',
            'EM-TRÂNSITO', 'EM-PODER-DO-TERCEIRO', 'RETORNO-PARCIAL', 'RETORNADA',
            'CONCLUÍDA', 'CANCELADA'
        );
    END IF;
END $$;

-- 2. Tabela de Ordens de Industrialização
CREATE TABLE IF NOT EXISTS public.ordens_industrializacao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero serial UNIQUE,
    empresa_id uuid, 
    fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id),
    op_id uuid REFERENCES public.ordens_producao(id),
    artigo_id uuid REFERENCES public.articles(id),
    servico_tipo text NOT NULL, 
    cor_solicitada text,
    data_emissao timestamptz DEFAULT now(),
    data_prevista date,
    status public.ordem_industrializacao_status DEFAULT 'RASCUNHO',
    observacao text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    idempotency_key uuid UNIQUE
);

GRANT SELECT, INSERT, UPDATE ON public.ordens_industrializacao TO authenticated;
GRANT ALL ON public.ordens_industrializacao TO service_role;

-- 3. Tabela de Remessas para Terceiros
CREATE TABLE IF NOT EXISTS public.remessas_terceiros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_id uuid NOT NULL REFERENCES public.ordens_industrializacao(id),
    data_saida timestamptz DEFAULT now(),
    documento_referencia text, 
    transportadora_id uuid REFERENCES public.fornecedores(id),
    observacao text,
    status text DEFAULT 'ENVIADO',
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT ON public.remessas_terceiros TO authenticated;
GRANT ALL ON public.remessas_terceiros TO service_role;

-- 4. Itens da Remessa (Lotes enviados)
CREATE TABLE IF NOT EXISTS public.remessa_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    remessa_id uuid NOT NULL REFERENCES public.remessas_terceiros(id),
    lote_origem_id uuid NOT NULL REFERENCES public.lotes(id),
    quantidade_enviada numeric(14,4) NOT NULL,
    quantidade_retornada numeric(14,4) DEFAULT 0,
    quantidade_perdida numeric(14,4) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.remessa_itens TO authenticated;
GRANT ALL ON public.remessa_itens TO service_role;

-- 5. Tabela de Retornos de Terceiros
CREATE TABLE IF NOT EXISTS public.retornos_terceiros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    remessa_id uuid NOT NULL REFERENCES public.remessas_terceiros(id),
    data_chegada timestamptz DEFAULT now(),
    documento_referencia text, 
    custo_servico numeric(14,4) DEFAULT 0,
    observacao text,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT ON public.retornos_terceiros TO authenticated;
GRANT ALL ON public.retornos_terceiros TO service_role;

-- 6. Itens do Retorno (Lotes resultantes)
CREATE TABLE IF NOT EXISTS public.retorno_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    retorno_id uuid NOT NULL REFERENCES public.retornos_terceiros(id),
    remessa_item_id uuid NOT NULL REFERENCES public.remessa_itens(id),
    lote_resultante_id uuid NOT NULL REFERENCES public.lotes(id),
    quantidade_recebida numeric(14,4) NOT NULL,
    quantidade_perdida numeric(14,4) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.retorno_itens TO authenticated;
GRANT ALL ON public.retorno_itens TO service_role;

-- 7. RLS
ALTER TABLE public.ordens_industrializacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remessas_terceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remessa_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retornos_terceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retorno_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_industrializacao" ON public.ordens_industrializacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_remessas" ON public.remessas_terceiros FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_remessa_itens" ON public.remessa_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_retornos" ON public.retornos_terceiros FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_retorno_itens" ON public.retorno_itens FOR SELECT TO authenticated USING (true);

-- 8. Funções Transacionais

CREATE OR REPLACE FUNCTION public.ship_material_to_external_processor(
    p_ordem_id uuid,
    p_lotes_data jsonb, 
    p_documento_referencia text DEFAULT NULL,
    p_idempotency_key uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_remessa_id uuid;
    v_lote record;
    v_item jsonb;
    v_res jsonb;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

    IF p_idempotency_key IS NOT NULL THEN
        SELECT payload INTO v_res FROM audit_logs WHERE payload->>'idempotency_key' = p_idempotency_key::text AND acao = 'REMESSA_TERCEIRO' LIMIT 1;
        IF FOUND THEN RETURN v_res; END IF;
    END IF;

    INSERT INTO public.remessas_terceiros (ordem_id, documento_referencia, user_id)
    VALUES (p_ordem_id, p_documento_referencia, v_user_id)
    RETURNING id INTO v_remessa_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_lotes_data) LOOP
        SELECT * INTO v_lote FROM public.lotes WHERE id = (v_item->>'lote_id')::uuid FOR UPDATE;
        
        IF v_lote.quantidade_disponivel < (v_item->>'quantidade')::numeric THEN
            RAISE EXCEPTION 'Saldo insuficiente no lote %', v_lote.numero_lote;
        END IF;

        INSERT INTO public.remessa_itens (remessa_id, lote_origem_id, quantidade_enviada)
        VALUES (v_remessa_id, v_lote.id, (v_item->>'quantidade')::numeric);

        INSERT INTO public.estoque_movimentos (tipo, operacao, lote_id, item_tipo, item_id, quantidade, saldo_anterior, saldo_posterior, user_id, observacao)
        VALUES ('transferencia', 'saida', v_lote.id, v_lote.tipo, v_lote.item_id, (v_item->>'quantidade')::numeric, v_lote.quantidade_disponivel, v_lote.quantidade_disponivel - (v_item->>'quantidade')::numeric, v_user_id, 'Remessa para Terceiro');

        UPDATE public.lotes 
        SET quantidade_disponivel = quantidade_disponivel - (v_item->>'quantidade')::numeric,
            quantidade = quantidade - (v_item->>'quantidade')::numeric,
            status_processo = 'EM-PODER-DO-TERCEIRO'
        WHERE id = v_lote.id;
    END LOOP;

    UPDATE public.ordens_industrializacao SET status = 'EM-PODER-DO-TERCEIRO' WHERE id = p_ordem_id;

    v_res := jsonb_build_object('remessa_id', v_remessa_id, 'status', 'success');
    
    INSERT INTO public.audit_logs (acao, entidade, entidade_id, user_id, payload)
    VALUES ('REMESSA_TERCEIRO', 'remessas_terceiros', v_remessa_id, v_user_id, jsonb_build_object('idempotency_key', p_idempotency_key, 'ordem_id', p_ordem_id));

    RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ship_material_to_external_processor(uuid, jsonb, text, uuid) TO authenticated;
