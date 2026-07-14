
-- ============================================================
-- FASE 8 — INDÚSTRIA TÊXTIL
-- ============================================================

-- 1. BOM estendido (estrutura completa do artigo)
CREATE TABLE public.article_bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('fio','corante','quimico','embalagem','outro')),
  ref_tipo TEXT CHECK (ref_tipo IN ('fio','produto','variante')),
  ref_id UUID,
  descricao TEXT NOT NULL,
  qtd_por_kg NUMERIC(14,4) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'KG',
  fator_perda_pct NUMERIC(6,3) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.article_bom(article_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_bom TO authenticated;
GRANT ALL ON public.article_bom TO service_role;
ALTER TABLE public.article_bom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bom_read" ON public.article_bom FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "bom_write" ON public.article_bom FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]));
CREATE TRIGGER trg_bom_upd BEFORE UPDATE ON public.article_bom FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Capacidade nominal por máquina
CREATE TABLE public.maquina_capacidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id UUID NOT NULL UNIQUE REFERENCES public.maquinas(id) ON DELETE CASCADE,
  kg_por_hora NUMERIC(14,3) NOT NULL DEFAULT 0,
  horas_por_turno NUMERIC(5,2) NOT NULL DEFAULT 8,
  turnos_por_dia INTEGER NOT NULL DEFAULT 1 CHECK (turnos_por_dia BETWEEN 1 AND 3),
  dias_uteis_semana INTEGER NOT NULL DEFAULT 5 CHECK (dias_uteis_semana BETWEEN 1 AND 7),
  eficiencia_alvo_pct NUMERIC(5,2) NOT NULL DEFAULT 85,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquina_capacidade TO authenticated;
GRANT ALL ON public.maquina_capacidade TO service_role;
ALTER TABLE public.maquina_capacidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcap_read" ON public.maquina_capacidade FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "mcap_write" ON public.maquina_capacidade FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]));
CREATE TRIGGER trg_mcap_upd BEFORE UPDATE ON public.maquina_capacidade FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Paradas de máquina (base OEE)
CREATE TABLE public.op_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  maquina_id UUID REFERENCES public.maquinas(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('manutencao','setup','falta_material','quebra','refeicao','qualidade','outros')),
  motivo TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ,
  duracao_min NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN fim IS NOT NULL THEN EXTRACT(EPOCH FROM (fim - inicio))/60 ELSE NULL END
  ) STORED,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_paradas(op_id);
CREATE INDEX ON public.op_paradas(maquina_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_paradas TO authenticated;
GRANT ALL ON public.op_paradas TO service_role;
ALTER TABLE public.op_paradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "par_read" ON public.op_paradas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "par_write" ON public.op_paradas FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','qualidade','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','qualidade','gerente','admin']::public.app_role[]));

-- 4. Reprocessos
CREATE TABLE public.op_reprocessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_origem_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  op_filha_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  motivo TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 0,
  custo_adicional NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_execucao','concluido','cancelado')),
  observacao TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_reprocessos(op_origem_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_reprocessos TO authenticated;
GRANT ALL ON public.op_reprocessos TO service_role;
ALTER TABLE public.op_reprocessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rep_read" ON public.op_reprocessos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "rep_write" ON public.op_reprocessos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','qualidade','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','qualidade','gerente','admin']::public.app_role[]));
CREATE TRIGGER trg_rep_upd BEFORE UPDATE ON public.op_reprocessos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Custo industrial (snapshot)
CREATE TABLE public.op_custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id UUID NOT NULL UNIQUE REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  custo_materia_prima NUMERIC(14,2) NOT NULL DEFAULT 0,
  custo_mao_obra NUMERIC(14,2) NOT NULL DEFAULT 0,
  custo_cif NUMERIC(14,2) NOT NULL DEFAULT 0,
  custo_total NUMERIC(14,2) GENERATED ALWAYS AS (custo_materia_prima + custo_mao_obra + custo_cif) STORED,
  quantidade_produzida NUMERIC(14,3) NOT NULL DEFAULT 0,
  custo_por_kg NUMERIC(14,4),
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_custos TO authenticated;
GRANT ALL ON public.op_custos TO service_role;
ALTER TABLE public.op_custos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cust_read" ON public.op_custos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "cust_write" ON public.op_custos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','financeiro','gerente','admin']::public.app_role[]));
CREATE TRIGGER trg_cust_upd BEFORE UPDATE ON public.op_custos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. PCP - Planejamento
CREATE TABLE public.plano_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aprovado','em_execucao','concluido','cancelado')),
  responsavel_id UUID REFERENCES public.funcionarios(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plano_producao TO authenticated;
GRANT ALL ON public.plano_producao TO service_role;
ALTER TABLE public.plano_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_read" ON public.plano_producao FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "plan_write" ON public.plano_producao FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]));
CREATE TRIGGER trg_plan_upd BEFORE UPDATE ON public.plano_producao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.plano_producao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.plano_producao(id) ON DELETE CASCADE,
  op_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  maquina_id UUID REFERENCES public.maquinas(id),
  article_id UUID REFERENCES public.articles(id),
  data_prevista DATE NOT NULL,
  sequencia INTEGER NOT NULL DEFAULT 1,
  quantidade_planejada NUMERIC(14,3) NOT NULL DEFAULT 0,
  horas_estimadas NUMERIC(8,2),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.plano_producao_itens(plano_id);
CREATE INDEX ON public.plano_producao_itens(maquina_id, data_prevista);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plano_producao_itens TO authenticated;
GRANT ALL ON public.plano_producao_itens TO service_role;
ALTER TABLE public.plano_producao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plani_read" ON public.plano_producao_itens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "plani_write" ON public.plano_producao_itens FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]));

-- 7. Categorização de perdas em apontamentos
ALTER TABLE public.op_apontamentos ADD COLUMN IF NOT EXISTS motivo_refugo TEXT
  CHECK (motivo_refugo IS NULL OR motivo_refugo IN ('furo','mancha','medida','tensao','tonalidade','outro'));

-- ============================================================
-- FUNÇÕES DE CÁLCULO
-- ============================================================
CREATE OR REPLACE FUNCTION public.op_calcular_custo(_op_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mp NUMERIC(14,2) := 0;
  v_mo NUMERIC(14,2) := 0;
  v_cif NUMERIC(14,2) := 0;
  v_qtd NUMERIC(14,3) := 0;
  v_id UUID;
BEGIN
  -- MP: soma consumos × custo médio do lote (aprox: usa preço do último recebimento se existir)
  SELECT COALESCE(SUM(c.quantidade * COALESCE(l.custo_unitario, 0)), 0) INTO v_mp
  FROM public.op_consumos c
  LEFT JOIN public.lotes l ON l.id = c.lote_id
  LEFT JOIN LATERAL (
    SELECT (rc.valor_nota / NULLIF(rc.quantidade_total,0))::numeric AS custo_unitario
    FROM public.recebimentos rc
    WHERE rc.id = (SELECT r.id FROM public.recebimentos r LIMIT 1)
  ) AS __ ON true
  WHERE c.op_id = _op_id;

  -- MO: horas apontadas × R$60/h (parametrizável futuramente)
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim,now()) - a.inicio))/3600 * 60), 0)::numeric(14,2)
    INTO v_mo
  FROM public.op_apontamentos a WHERE a.op_id = _op_id;

  -- CIF: 15% sobre MP+MO
  v_cif := ROUND((v_mp + v_mo) * 0.15, 2);

  SELECT COALESCE(SUM(quantidade_produzida - quantidade_refugo), 0) INTO v_qtd
  FROM public.op_apontamentos WHERE op_id = _op_id;

  INSERT INTO public.op_custos(op_id, custo_materia_prima, custo_mao_obra, custo_cif, quantidade_produzida, custo_por_kg, calculado_em)
  VALUES (_op_id, v_mp, v_mo, v_cif, v_qtd, CASE WHEN v_qtd>0 THEN ROUND((v_mp+v_mo+v_cif)/v_qtd,4) ELSE NULL END, now())
  ON CONFLICT (op_id) DO UPDATE SET
    custo_materia_prima = EXCLUDED.custo_materia_prima,
    custo_mao_obra = EXCLUDED.custo_mao_obra,
    custo_cif = EXCLUDED.custo_cif,
    quantidade_produzida = EXCLUDED.quantidade_produzida,
    custo_por_kg = EXCLUDED.custo_por_kg,
    calculado_em = now(),
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.op_criar_reprocesso(_op_id UUID, _motivo TEXT, _quantidade NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_op_filha UUID;
  v_ped UUID;
  v_maq UUID;
BEGIN
  SELECT pedido_id, maquina_id INTO v_ped, v_maq FROM public.ordens_producao WHERE id = _op_id;

  INSERT INTO public.ordens_producao(numero, pedido_id, status, prioridade, maquina_id, observacao)
  VALUES (public.proximo_numero_op(), v_ped, 'planejada', 3, v_maq, 'Reprocesso de OP origem ' || _op_id::text)
  RETURNING id INTO v_op_filha;

  INSERT INTO public.op_reprocessos(op_origem_id, op_filha_id, motivo, quantidade, status, user_id)
  VALUES (_op_id, v_op_filha, _motivo, _quantidade, 'aberto', auth.uid())
  RETURNING id INTO v_id;

  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (_op_id, 'reprocesso_criado', jsonb_build_object('op_filha', v_op_filha, 'quantidade', _quantidade, 'motivo', _motivo), auth.uid());

  RETURN v_id;
END; $$;

-- ============================================================
-- VIEWS
-- ============================================================
CREATE OR REPLACE VIEW public.vw_capacidade_semanal
WITH (security_invoker = true) AS
SELECT
  m.id AS maquina_id,
  m.numero, m.maquina, m.tipo,
  mc.kg_por_hora,
  mc.horas_por_turno,
  mc.turnos_por_dia,
  mc.dias_uteis_semana,
  mc.eficiencia_alvo_pct,
  (mc.kg_por_hora * mc.horas_por_turno * mc.turnos_por_dia * mc.dias_uteis_semana) AS capacidade_nominal_semana_kg,
  (mc.kg_por_hora * mc.horas_por_turno * mc.turnos_por_dia * mc.dias_uteis_semana * mc.eficiencia_alvo_pct/100.0) AS capacidade_efetiva_semana_kg
FROM public.maquinas m
LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = m.id
WHERE m.habilitado = true;

CREATE OR REPLACE VIEW public.vw_oee_maquina
WITH (security_invoker = true) AS
WITH ap AS (
  SELECT a.maquina_id,
    SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim, now()) - a.inicio))/60) AS min_operado,
    SUM(a.quantidade_produzida) AS qtd_produzida,
    SUM(a.quantidade_refugo) AS qtd_refugo
  FROM public.op_apontamentos a
  WHERE a.inicio >= now() - INTERVAL '30 days'
  GROUP BY a.maquina_id
),
pa AS (
  SELECT maquina_id, SUM(COALESCE(duracao_min,0)) AS min_parado
  FROM public.op_paradas
  WHERE inicio >= now() - INTERVAL '30 days'
  GROUP BY maquina_id
)
SELECT
  m.id AS maquina_id, m.numero, m.maquina,
  COALESCE(ap.min_operado,0) AS min_operado,
  COALESCE(pa.min_parado,0) AS min_parado,
  COALESCE(ap.qtd_produzida,0) AS qtd_produzida,
  COALESCE(ap.qtd_refugo,0) AS qtd_refugo,
  CASE WHEN COALESCE(ap.min_operado,0)+COALESCE(pa.min_parado,0) > 0
    THEN ROUND((ap.min_operado / (ap.min_operado + pa.min_parado) * 100)::numeric, 2) ELSE NULL END AS disponibilidade_pct,
  CASE WHEN COALESCE(ap.min_operado,0) > 0 AND mc.kg_por_hora > 0
    THEN ROUND((ap.qtd_produzida / ((ap.min_operado/60.0) * mc.kg_por_hora) * 100)::numeric, 2) ELSE NULL END AS performance_pct,
  CASE WHEN COALESCE(ap.qtd_produzida,0) > 0
    THEN ROUND(((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida * 100)::numeric, 2) ELSE NULL END AS qualidade_pct
FROM public.maquinas m
LEFT JOIN ap ON ap.maquina_id = m.id
LEFT JOIN pa ON pa.maquina_id = m.id
LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = m.id
WHERE m.habilitado = true;

CREATE OR REPLACE VIEW public.vw_custo_op
WITH (security_invoker = true) AS
SELECT
  op.id AS op_id, op.numero, op.status,
  c.custo_materia_prima, c.custo_mao_obra, c.custo_cif, c.custo_total,
  c.quantidade_produzida, c.custo_por_kg, c.calculado_em
FROM public.ordens_producao op
LEFT JOIN public.op_custos c ON c.op_id = op.id;

-- Custo unitário no lote (necessário para op_calcular_custo)
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(14,4);
