
-- 1) NCM catálogo
CREATE TABLE IF NOT EXISTS public.ncm_catalogo (
  codigo TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  cest_sugerido TEXT,
  ex_tipi TEXT,
  aliq_ipi_padrao NUMERIC(6,2) DEFAULT 0,
  cst_ipi_padrao TEXT,
  cst_pis_padrao TEXT,
  aliq_pis_padrao NUMERIC(6,4) DEFAULT 0,
  cst_cofins_padrao TEXT,
  aliq_cofins_padrao NUMERIC(6,4) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ncm_catalogo TO authenticated;
GRANT ALL ON public.ncm_catalogo TO service_role;
ALTER TABLE public.ncm_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read ncm" ON public.ncm_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage ncm" ON public.ncm_catalogo FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_ncm_updated BEFORE UPDATE ON public.ncm_catalogo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Regras tributárias
CREATE TABLE IF NOT EXISTS public.regras_tributarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  prioridade INT NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT true,

  uf_origem TEXT,
  uf_destino TEXT,
  regime_tributario_emitente TEXT CHECK (regime_tributario_emitente IN ('simples','presumido','real') OR regime_tributario_emitente IS NULL),
  tipo_cliente TEXT CHECK (tipo_cliente IN ('pj_contribuinte','pj_nao_contrib','pf','orgao_publico','exterior') OR tipo_cliente IS NULL),
  tipo_operacao TEXT CHECK (tipo_operacao IN ('venda','devolucao','remessa','retorno','bonif','amostra','industrializacao','exportacao') OR tipo_operacao IS NULL),
  ncm_prefix TEXT,
  cest TEXT,
  finalidade TEXT CHECK (finalidade IN ('consumo','revenda','industrializacao','ativo') OR finalidade IS NULL),

  cfop TEXT NOT NULL,
  cst_icms TEXT,
  csosn TEXT,
  aliq_icms NUMERIC(6,2) DEFAULT 0,
  red_base_icms_pct NUMERIC(6,2) DEFAULT 0,
  calcula_st BOOLEAN NOT NULL DEFAULT false,
  mva_pct NUMERIC(6,2) DEFAULT 0,
  aliq_icms_st NUMERIC(6,2) DEFAULT 0,
  aliq_fcp NUMERIC(6,2) DEFAULT 0,
  aliq_fcp_st NUMERIC(6,2) DEFAULT 0,
  cst_ipi TEXT,
  aliq_ipi NUMERIC(6,2) DEFAULT 0,
  cst_pis TEXT,
  aliq_pis NUMERIC(6,4) DEFAULT 0,
  cst_cofins TEXT,
  aliq_cofins NUMERIC(6,4) DEFAULT 0,
  calcula_difal BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regras_scope ON public.regras_tributarias (ativo, prioridade DESC, uf_origem, uf_destino, tipo_operacao);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_tributarias TO authenticated;
GRANT ALL ON public.regras_tributarias TO service_role;
ALTER TABLE public.regras_tributarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read regras" ON public.regras_tributarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage regras" ON public.regras_tributarias FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_regras_updated BEFORE UPDATE ON public.regras_tributarias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Benefícios fiscais
CREATE TABLE IF NOT EXISTS public.beneficios_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf TEXT,
  ncm_prefix TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('reducao','isencao','diferimento','suspensao')),
  percentual NUMERIC(6,2) NOT NULL DEFAULT 0,
  base_legal TEXT,
  vigencia_inicio DATE,
  vigencia_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficios_fiscais TO authenticated;
GRANT ALL ON public.beneficios_fiscais TO service_role;
ALTER TABLE public.beneficios_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read beneficios" ON public.beneficios_fiscais FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage beneficios" ON public.beneficios_fiscais FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_beneficios_updated BEFORE UPDATE ON public.beneficios_fiscais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Colunas complementares
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS consumidor_final BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS indicador_ie TEXT CHECK (indicador_ie IN ('1','2','9') OR indicador_ie IS NULL);
ALTER TABLE public.empresa ADD COLUMN IF NOT EXISTS crt INT CHECK (crt IN (1,2,3) OR crt IS NULL);
