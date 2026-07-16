
-- ============ MPS Períodos ============
CREATE TABLE public.mps_periodos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('mensal','semanal')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(periodo, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mps_periodos TO authenticated;
GRANT ALL ON public.mps_periodos TO service_role;
ALTER TABLE public.mps_periodos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read mps_periodos" ON public.mps_periodos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write mps_periodos" ON public.mps_periodos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ MPS Previsões ============
CREATE TABLE public.mps_previsoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id UUID NOT NULL REFERENCES public.mps_periodos(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  quantidade_prevista NUMERIC(12,3) NOT NULL DEFAULT 0,
  quantidade_firme NUMERIC(12,3) NOT NULL DEFAULT 0,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual','historico','pedidos')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(periodo_id, article_id)
);
CREATE INDEX idx_mps_prev_periodo ON public.mps_previsoes(periodo_id);
CREATE INDEX idx_mps_prev_article ON public.mps_previsoes(article_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mps_previsoes TO authenticated;
GRANT ALL ON public.mps_previsoes TO service_role;
ALTER TABLE public.mps_previsoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read mps_previsoes" ON public.mps_previsoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write mps_previsoes" ON public.mps_previsoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Programação (Sequenciamento fino) ============
CREATE TABLE public.programacao_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  op_item_id UUID REFERENCES public.op_itens(id) ON DELETE CASCADE,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE RESTRICT,
  inicio_previsto TIMESTAMPTZ NOT NULL,
  fim_previsto TIMESTAMPTZ NOT NULL,
  sequencia INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','em_execucao','concluido','cancelado')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fim_previsto > inicio_previsto)
);
CREATE INDEX idx_prog_slots_maquina ON public.programacao_slots(maquina_id, inicio_previsto);
CREATE INDEX idx_prog_slots_op ON public.programacao_slots(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programacao_slots TO authenticated;
GRANT ALL ON public.programacao_slots TO service_role;
ALTER TABLE public.programacao_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read prog_slots" ON public.programacao_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write prog_slots" ON public.programacao_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Motivos de parada (catálogo) ============
CREATE TABLE public.motivos_parada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('setup','manutencao','qualidade','falta_material','falta_operador','energia','outros')),
  planejada BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivos_parada TO authenticated;
GRANT ALL ON public.motivos_parada TO service_role;
ALTER TABLE public.motivos_parada ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read motivos" ON public.motivos_parada FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write motivos" ON public.motivos_parada FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Trigger updated_at ============
CREATE OR REPLACE FUNCTION public.pcp_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_mps_per_upd BEFORE UPDATE ON public.mps_periodos FOR EACH ROW EXECUTE FUNCTION public.pcp_touch_updated_at();
CREATE TRIGGER trg_mps_prev_upd BEFORE UPDATE ON public.mps_previsoes FOR EACH ROW EXECUTE FUNCTION public.pcp_touch_updated_at();
CREATE TRIGGER trg_prog_upd BEFORE UPDATE ON public.programacao_slots FOR EACH ROW EXECUTE FUNCTION public.pcp_touch_updated_at();
CREATE TRIGGER trg_motivos_upd BEFORE UPDATE ON public.motivos_parada FOR EACH ROW EXECUTE FUNCTION public.pcp_touch_updated_at();
