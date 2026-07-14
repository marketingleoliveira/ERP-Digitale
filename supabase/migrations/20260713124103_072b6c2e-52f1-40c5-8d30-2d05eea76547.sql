
-- ============ OPERACOES PRODUTIVAS ============
CREATE TABLE public.operacoes_produtivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'producao' CHECK (tipo IN ('malharia','tinturaria','rama','acabamento','corte','costura','inspecao','expedicao','producao','outros')),
  centro_trabalho TEXT,
  setup_padrao_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  tempo_padrao_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operacoes_produtivas TO authenticated;
GRANT ALL ON public.operacoes_produtivas TO service_role;
ALTER TABLE public.operacoes_produtivas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_prod_select" ON public.operacoes_produtivas FOR SELECT TO authenticated USING (true);
CREATE POLICY "op_prod_write" ON public.operacoes_produtivas FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_op_prod_updated BEFORE UPDATE ON public.operacoes_produtivas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROTEIROS ============
CREATE TABLE public.roteiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  revisao INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  tempo_padrao_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  setup_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (codigo, revisao)
);
CREATE INDEX idx_roteiros_article ON public.roteiros(article_id);
CREATE INDEX idx_roteiros_ativo ON public.roteiros(ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiros TO authenticated;
GRANT ALL ON public.roteiros TO service_role;
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roteiros_select" ON public.roteiros FOR SELECT TO authenticated USING (true);
CREATE POLICY "roteiros_write" ON public.roteiros FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_roteiros_updated BEFORE UPDATE ON public.roteiros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROTEIRO ETAPAS ============
CREATE TABLE public.roteiro_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id UUID NOT NULL REFERENCES public.roteiros(id) ON DELETE CASCADE,
  sequencia INTEGER NOT NULL,
  operacao_id UUID REFERENCES public.operacoes_produtivas(id) ON DELETE SET NULL,
  nome_operacao TEXT NOT NULL,
  centro_trabalho TEXT,
  maquina_preferencial_id UUID REFERENCES public.maquinas(id) ON DELETE SET NULL,
  tempo_padrao_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  setup_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  consumo_previsto NUMERIC(14,3) NOT NULL DEFAULT 0,
  perdas_previstas_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  qualidade_obrigatoria BOOLEAN NOT NULL DEFAULT false,
  terceirizada BOOLEAN NOT NULL DEFAULT false,
  fornecedor_terceiro_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (roteiro_id, sequencia)
);
CREATE INDEX idx_etapas_roteiro ON public.roteiro_etapas(roteiro_id);
CREATE INDEX idx_etapas_maquina ON public.roteiro_etapas(maquina_preferencial_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_etapas TO authenticated;
GRANT ALL ON public.roteiro_etapas TO service_role;
ALTER TABLE public.roteiro_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etapas_select" ON public.roteiro_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "etapas_write" ON public.roteiro_etapas FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_etapas_updated BEFORE UPDATE ON public.roteiro_etapas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MAQUINAS ELEGIVEIS (N:N) ============
CREATE TABLE public.roteiro_etapa_maquinas (
  etapa_id UUID NOT NULL REFERENCES public.roteiro_etapas(id) ON DELETE CASCADE,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  PRIMARY KEY (etapa_id, maquina_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_etapa_maquinas TO authenticated;
GRANT ALL ON public.roteiro_etapa_maquinas TO service_role;
ALTER TABLE public.roteiro_etapa_maquinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etapa_maq_select" ON public.roteiro_etapa_maquinas FOR SELECT TO authenticated USING (true);
CREATE POLICY "etapa_maq_write" ON public.roteiro_etapa_maquinas FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

-- ============ SEED: operações do exemplo CARIBE ============
INSERT INTO public.operacoes_produtivas (codigo, nome, tipo, centro_trabalho) VALUES
  ('OP-MAL', 'Malharia', 'malharia', 'Tecelagem'),
  ('OP-TIN', 'Tinturaria', 'tinturaria', 'Beneficiamento'),
  ('OP-RAM', 'Rama', 'rama', 'Acabamento'),
  ('OP-INS', 'Inspeção', 'inspecao', 'Qualidade'),
  ('OP-EXP', 'Expedição', 'expedicao', 'Logística')
ON CONFLICT (codigo) DO NOTHING;
