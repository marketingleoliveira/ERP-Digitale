
-- 1. Tabela de Genealogia
CREATE TABLE IF NOT EXISTS public.lote_genealogia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_resultante_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE,
    lote_origem_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE,
    op_id UUID REFERENCES public.ordens_producao(id),
    quantidade_consumida NUMERIC(15,4),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lote_genealogia TO authenticated;
GRANT ALL ON public.lote_genealogia TO service_role;

-- 2. Colunas Adicionais
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS quantidade_recebida NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS roteiro_id UUID REFERENCES public.roteiros(id);

ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS classificacao TEXT CHECK (classificacao IN ('MATERIA-PRIMA', 'PRODUTO-EM-PROCESSO', 'PRODUTO-ACABADO'));
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS status_processo TEXT;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS deposito TEXT;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS op_id UUID REFERENCES public.ordens_producao(id);

-- 3. Função de Simulação
CREATE OR REPLACE FUNCTION public.simulate_production_receipt(
    p_op_id UUID,
    p_quantidade_entrada NUMERIC,
    p_classificacao TEXT DEFAULT 'PRODUTO-ACABADO'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_op RECORD;
    v_prod_boa NUMERIC;
    v_ja_recebido NUMERIC;
    v_saldo NUMERIC;
    v_artigo_nome TEXT;
    v_unidade TEXT;
    v_custo_total NUMERIC;
BEGIN
    SELECT op.*, a.nome as artigo_nome, a.unidade_medida 
    INTO v_op 
    FROM public.ordens_producao op
    JOIN public.articles a ON a.id = (SELECT artigo_id FROM public.op_itens WHERE op_id = op.id LIMIT 1)
    WHERE op.id = p_op_id;

    IF v_op IS NULL THEN
        -- Tentar pegar artigo_id direto se existir na ordens_producao (depende do schema legado)
        -- Auditei que existe op_itens
        NULL;
    END IF;

    SELECT COALESCE(SUM(quantidade_boa), 0) INTO v_prod_boa
    FROM public.op_apontamentos
    WHERE op_id = p_op_id AND status = 'confirmado';

    v_ja_recebido := COALESCE(v_op.quantidade_recebida, 0);
    v_saldo := v_prod_boa - v_ja_recebido;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_custo_total
    FROM public.op_custos WHERE op_id = p_op_id;

    RETURN json_build_object(
        'saldo_elegivel', v_saldo,
        'quantidade_produzida', v_prod_boa,
        'quantidade_ja_recebida', v_ja_recebido,
        'artigo', v_op.artigo_nome,
        'unidade', v_op.unidade_medida,
        'classificacao_sugerida', COALESCE(p_classificacao, 'PRODUTO-ACABADO'),
        'custo_unitario_provisorio', CASE WHEN v_prod_boa > 0 THEN v_custo_total / v_prod_boa ELSE 0 END,
        'avisos', CASE WHEN v_saldo <= 0 THEN ARRAY['Sem saldo disponível para entrada'] ELSE ARRAY[]::TEXT[] END
    );
END;
$$;

-- 4. Função Principal
CREATE OR REPLACE FUNCTION public.receive_production_output(
    p_op_id UUID,
    p_quantidade NUMERIC,
    p_deposito TEXT,
    p_classificacao TEXT,
    p_observacao TEXT DEFAULT NULL,
    p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_op RECORD;
    v_prod_boa NUMERIC;
    v_saldo NUMERIC;
    v_lote_id UUID;
    v_lote_num TEXT;
    v_mov_id UUID;
    v_artigo_id UUID;
BEGIN
    SELECT * INTO v_op FROM public.ordens_producao WHERE id = p_op_id FOR UPDATE;
    SELECT artigo_id INTO v_artigo_id FROM public.op_itens WHERE op_id = p_op_id LIMIT 1;

    IF v_op.status::text IN ('cancelada', 'encerrada') THEN
        RAISE EXCEPTION 'OP não está em estado produtivo';
    END IF;

    SELECT COALESCE(SUM(quantidade_boa), 0) INTO v_prod_boa
    FROM public.op_apontamentos
    WHERE op_id = p_op_id AND status = 'confirmado';

    v_saldo := v_prod_boa - COALESCE(v_op.quantidade_recebida, 0);

    IF p_quantidade > (v_saldo + 0.0001) THEN
        RAISE EXCEPTION 'Quantidade (%) superior ao saldo elegível (%)', p_quantidade, v_saldo;
    END IF;

    v_lote_num := 'L' || to_char(now(), 'YYYYMMDD') || '-' || substring(p_op_id::text, 1, 4);
    
    INSERT INTO public.lotes (
        numero_lote, artigo_id, item_id, quantidade, quantidade_disponivel, 
        data_entrada, classificacao, deposito, op_id, observacao
    ) VALUES (
        v_lote_num, v_artigo_id, v_artigo_id, p_quantidade, p_quantidade,
        now(), p_classificacao, p_deposito, p_op_id, p_observacao
    ) RETURNING id INTO v_lote_id;

    INSERT INTO public.lote_genealogia (lote_resultante_id, lote_origem_id, op_id, quantidade_consumida)
    SELECT v_lote_id, c.lote_id, p_op_id, c.quantidade
    FROM public.op_consumos c
    WHERE c.op_id = p_op_id;

    INSERT INTO public.estoque_movimentos (
        lote_id, quantidade, tipo, deposito_origem, deposito_destino, 
        documento_tipo, documento_id, usuario_id, observacao
    ) VALUES (
        v_lote_id, p_quantidade, 'ENTRADA', 'PRODUCAO', p_deposito,
        'ORDEM_PRODUCAO', p_op_id, v_user_id, 'Entrada de produção OP ' || v_op.numero
    ) RETURNING id INTO v_mov_id;

    UPDATE public.ordens_producao 
    SET quantidade_recebida = COALESCE(quantidade_recebida, 0) + p_quantidade,
        status = CASE 
            WHEN (COALESCE(quantidade_recebida, 0) + p_quantidade) >= v_prod_boa THEN 'finalizada'::op_status 
            ELSE 'producao_parcial'::op_status 
        END
    WHERE id = p_op_id;

    INSERT INTO public.op_eventos (op_id, tipo, descricao, usuario_id)
    VALUES (p_op_id, 'ENTRADA_ESTOQUE', 'Entrada de ' || p_quantidade || ' no lote ' || v_lote_num, v_user_id);

    RETURN json_build_object(
        'success', true,
        'lote_id', v_lote_id,
        'lote_numero', v_lote_num,
        'movimentacao_id', v_mov_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_production_receipt TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_production_output TO authenticated;
