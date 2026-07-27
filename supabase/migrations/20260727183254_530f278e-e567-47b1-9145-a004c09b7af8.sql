
-- Complemento da Etapa 9: Tabelas de detalhes, Acabamento, Revisão e Funções Transacionais

-- 1. Tabelas de detalhes de inspeção e NCs
CREATE TABLE IF NOT EXISTS public.inspecao_resultados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspecao_id UUID REFERENCES public.inspecoes_qualidade(id) ON DELETE CASCADE,
    caracteristica_id UUID REFERENCES public.qualidade_plano_caracteristicas(id),
    valor_medido NUMERIC,
    resultado_qualitativo TEXT,
    conforme BOOLEAN,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspecao_defeitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspecao_id UUID REFERENCES public.inspecoes_qualidade(id) ON DELETE CASCADE,
    tipo_defeito TEXT NOT NULL,
    severidade TEXT CHECK (severidade IN ('leve', 'moderado', 'grave', 'critico')),
    quantidade NUMERIC NOT NULL,
    localizacao TEXT,
    disposicao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nao_conformidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero SERIAL,
    inspecao_id UUID REFERENCES public.inspecoes_qualidade(id),
    lote_id UUID REFERENCES public.lotes(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    descricao TEXT NOT NULL,
    causa_raiz TEXT,
    acao_corretiva TEXT,
    status TEXT DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'EM_ANALISE', 'CONCLUIDA', 'CANCELADA')),
    responsavel_id UUID REFERENCES auth.users(id),
    prazo DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.op_acabamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES public.lotes(id),
    operacao_id UUID,
    maquina_id UUID REFERENCES public.maquinas(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    quantidade_entrada NUMERIC,
    quantidade_saida NUMERIC,
    perda NUMERIC,
    responsavel_id UUID REFERENCES auth.users(id),
    parametros JSONB,
    status TEXT DEFAULT 'PENDENTE',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lote_revisoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES public.lotes(id),
    revisor_id UUID REFERENCES auth.users(id),
    data_revisao TIMESTAMPTZ DEFAULT now(),
    peso_revisado NUMERIC,
    metragem_revisada NUMERIC,
    largura_media NUMERIC,
    pontos_defeito INTEGER,
    classificacao public.lote_classificacao,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lote_rolos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE,
    numero_rolo TEXT NOT NULL,
    peso NUMERIC NOT NULL,
    metragem NUMERIC,
    largura NUMERIC,
    tonalidade TEXT,
    classificacao public.lote_classificacao DEFAULT 'PRIMEIRA_QUALIDADE',
    status TEXT DEFAULT 'DISPONIVEL',
    deposito TEXT,
    localizacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lote_id, numero_rolo)
);

-- 2. Colunas adicionais em lotes (complemento)
ALTER TABLE public.lotes 
ADD COLUMN IF NOT EXISTS saldo_reprocesso NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_quarentena NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_liberacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS liberado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS custo_definitivo NUMERIC;

-- 3. Grants e RLS
GRANT ALL ON public.inspecao_resultados TO authenticated;
GRANT ALL ON public.inspecao_defeitos TO authenticated;
GRANT ALL ON public.nao_conformidades TO authenticated;
GRANT ALL ON public.op_acabamentos TO authenticated;
GRANT ALL ON public.lote_revisoes TO authenticated;
GRANT ALL ON public.lote_rolos TO authenticated;

ALTER TABLE public.inspecao_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecao_defeitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_acabamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lote_revisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lote_rolos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total resultados" ON public.inspecao_resultados FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'qualidade'));
CREATE POLICY "Acesso total defeitos" ON public.inspecao_defeitos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'qualidade'));
CREATE POLICY "Acesso total nao_conf" ON public.nao_conformidades FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'qualidade') OR public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Acesso total acabamentos" ON public.op_acabamentos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'producao'));
CREATE POLICY "Acesso total revisoes" ON public.lote_revisoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'qualidade'));
CREATE POLICY "Acesso total rolos" ON public.lote_rolos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'qualidade'));

-- 4. RPCs Transacionais
CREATE OR REPLACE FUNCTION public.complete_lot_quality_inspection(
    p_lote_id UUID,
    p_inspecao_id UUID,
    p_resultados JSONB,
    p_defeitos JSONB,
    p_classificacoes JSONB,
    p_parecer TEXT,
    p_idempotency_key UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_total_classificado NUMERIC := 0;
    v_lote RECORD;
    v_inspecao RECORD;
    v_resultado_item RECORD;
    v_defeito_item RECORD;
    v_status public.qualidade_status := 'APROVADA';
    v_all_conforme BOOLEAN := true;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

    IF p_idempotency_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.inspecoes_qualidade WHERE idempotency_key = p_idempotency_key) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Operação já realizada');
    END IF;

    SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id FOR UPDATE;
    SELECT * INTO v_inspecao FROM public.inspecoes_qualidade WHERE id = p_inspecao_id FOR UPDATE;

    v_total_classificado := COALESCE((p_classificacoes->>'aprovada')::numeric, 0) + 
                            COALESCE((p_classificacoes->>'reprovada')::numeric, 0) + 
                            COALESCE((p_classificacoes->>'reprocesso')::numeric, 0) + 
                            COALESCE((p_classificacoes->>'quarentena')::numeric, 0) + 
                            COALESCE((p_classificacoes->>'refugo')::numeric, 0);

    IF v_total_classificado > v_lote.quantidade THEN RAISE EXCEPTION 'Quantidade classificada excede o saldo'; END IF;

    FOR v_resultado_item IN SELECT * FROM jsonb_to_recordset(p_resultados) AS x(caracteristica_id UUID, valor_medido NUMERIC, resultado_qualitativo TEXT, conforme BOOLEAN)
    LOOP
        INSERT INTO public.inspecao_resultados (inspecao_id, caracteristica_id, valor_medido, resultado_qualitativo, conforme)
        VALUES (p_inspecao_id, v_resultado_item.caracteristica_id, v_resultado_item.valor_medido, v_resultado_item.resultado_qualitativo, v_resultado_item.conforme);
        IF v_resultado_item.conforme = false THEN v_all_conforme := false; END IF;
    END LOOP;

    FOR v_defeito_item IN SELECT * FROM jsonb_to_recordset(p_defeitos) AS x(tipo_defeito TEXT, severidade TEXT, quantidade NUMERIC, localizacao TEXT)
    LOOP
        INSERT INTO public.inspecao_defeitos (inspecao_id, tipo_defeito, severidade, quantidade, localizacao)
        VALUES (p_inspecao_id, v_defeito_item.tipo_defeito, v_defeito_item.severidade, v_defeito_item.quantidade, v_defeito_item.localizacao);
        IF v_defeito_item.severidade IN ('grave', 'critico') THEN v_all_conforme := false; END IF;
    END LOOP;

    IF NOT v_all_conforme THEN v_status := 'REPROVADA'; END IF;

    UPDATE public.inspecoes_qualidade SET status = v_status, inspetor_id = v_user_id, data_fim = now(), parecer = p_parecer, idempotency_key = p_idempotency_key WHERE id = p_inspecao_id;

    UPDATE public.lotes SET
        saldo_qualidade = COALESCE(saldo_qualidade, 0) - v_total_classificado,
        saldo_aprovado = COALESCE(saldo_aprovado, 0) + COALESCE((p_classificacoes->>'aprovada')::numeric, 0),
        saldo_bloqueado = COALESCE(saldo_bloqueado, 0) + COALESCE((p_classificacoes->>'reprovada')::numeric, 0) + COALESCE((p_classificacoes->>'refugo')::numeric, 0),
        saldo_reprocesso = COALESCE(saldo_reprocesso, 0) + COALESCE((p_classificacoes->>'reprocesso')::numeric, 0),
        saldo_quarentena = COALESCE(saldo_quarentena, 0) + COALESCE((p_classificacoes->>'quarentena')::numeric, 0),
        status_processo = 'QUALIDADE_CONCLUIDA'
    WHERE id = p_lote_id;

    RETURN jsonb_build_object('success', true, 'status', v_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_lot_for_commercial_use(
    p_lote_id UUID,
    p_deposito TEXT,
    p_idempotency_key UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_lote RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

    SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id FOR UPDATE;
    IF v_lote.liberado_comercial THEN RETURN jsonb_build_object('success', true); END IF;
    IF v_lote.saldo_aprovado <= 0 THEN RAISE EXCEPTION 'Sem saldo aprovado'; END IF;

    UPDATE public.lotes SET
        liberado_comercial = true,
        data_liberacao = now(),
        liberado_por = v_user_id,
        deposito = p_deposito,
        quantidade_disponivel = saldo_aprovado,
        classificacao = 'PRODUTO_ACABADO'
    WHERE id = p_lote_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
