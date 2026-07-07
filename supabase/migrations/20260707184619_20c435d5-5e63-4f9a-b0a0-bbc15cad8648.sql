
-- CFOP
CREATE TABLE public.cfop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'saida' CHECK (tipo IN ('entrada','saida')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cfop TO authenticated;
GRANT ALL ON public.cfop TO service_role;
ALTER TABLE public.cfop ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfop_auth_all" ON public.cfop FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cfop_updated BEFORE UPDATE ON public.cfop FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- UF ICMS
CREATE TABLE public.uf_icms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf_origem TEXT NOT NULL,
  uf_destino TEXT NOT NULL,
  aliquota NUMERIC(6,3) NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'interestadual' CHECK (tipo IN ('interna','interestadual')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(uf_origem, uf_destino)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uf_icms TO authenticated;
GRANT ALL ON public.uf_icms TO service_role;
ALTER TABLE public.uf_icms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uf_icms_auth_all" ON public.uf_icms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_uf_icms_updated BEFORE UPDATE ON public.uf_icms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Impostos
CREATE TABLE public.impostos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ICMS' CHECK (tipo IN ('ICMS','IPI','PIS','COFINS','ISS','OUTRO')),
  aliquota NUMERIC(6,3) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impostos TO authenticated;
GRANT ALL ON public.impostos TO service_role;
ALTER TABLE public.impostos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impostos_auth_all" ON public.impostos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_impostos_updated BEFORE UPDATE ON public.impostos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notas Fiscais
CREATE TABLE public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'saida' CHECK (tipo IN ('saida','entrada','importacao')),
  numero TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  cliente_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.tinturarias(id) ON DELETE SET NULL,
  cfop_id UUID REFERENCES public.cfop(id) ON DELETE SET NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_icms NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_icms NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_ipi NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_pis NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_cofins NUMERIC(14,2) NOT NULL DEFAULT 0,
  chave_acesso TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','emitida','cancelada','autorizada')),
  xml_url TEXT,
  pdf_url TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais TO authenticated;
GRANT ALL ON public.notas_fiscais TO service_role;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas_fiscais_auth_all" ON public.notas_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_notas_fiscais_updated BEFORE UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_notas_fiscais_tipo ON public.notas_fiscais(tipo);
CREATE INDEX idx_notas_fiscais_data ON public.notas_fiscais(data_emissao DESC);

-- Itens da nota fiscal
CREATE TABLE public.notas_fiscais_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  ncm TEXT,
  cfop TEXT,
  quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
  valor_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais_itens TO authenticated;
GRANT ALL ON public.notas_fiscais_itens TO service_role;
ALTER TABLE public.notas_fiscais_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nf_itens_auth_all" ON public.notas_fiscais_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_nf_itens_nf ON public.notas_fiscais_itens(nota_fiscal_id);
