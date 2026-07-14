ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cfop_padrao TEXT,
  ADD COLUMN IF NOT EXISTS ean TEXT,
  ADD COLUMN IF NOT EXISTS ean_tributavel TEXT,
  ADD COLUMN IF NOT EXISTS unidade_tributavel TEXT,
  ADD COLUMN IF NOT EXISTS peso_bruto NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS peso_liquido NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS cst_icms TEXT,
  ADD COLUMN IF NOT EXISTS csosn TEXT,
  ADD COLUMN IF NOT EXISTS aliq_icms NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cst_ipi TEXT,
  ADD COLUMN IF NOT EXISTS aliq_ipi NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cst_pis TEXT,
  ADD COLUMN IF NOT EXISTS aliq_pis NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cst_cofins TEXT,
  ADD COLUMN IF NOT EXISTS aliq_cofins NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS codigo_beneficio TEXT,
  ADD COLUMN IF NOT EXISTS codigo_anp TEXT;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS consumidor_final BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contribuinte_icms INTEGER DEFAULT 9 CHECK (contribuinte_icms IN (1,2,9)),
  ADD COLUMN IF NOT EXISTS indicador_ie INTEGER DEFAULT 9 CHECK (indicador_ie IN (1,2,9)),
  ADD COLUMN IF NOT EXISTS indicador_presenca INTEGER DEFAULT 1 CHECK (indicador_presenca BETWEEN 0 AND 9),
  ADD COLUMN IF NOT EXISTS transportadora_preferencial_id UUID REFERENCES public.tinturarias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS regime_especial TEXT;

ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS crt INTEGER DEFAULT 1 CHECK (crt IN (1,2,3,4)),
  ADD COLUMN IF NOT EXISTS csc_id TEXT,
  ADD COLUMN IF NOT EXISTS csc_token TEXT,
  ADD COLUMN IF NOT EXISTS certificado_a1_path TEXT;

CREATE TABLE IF NOT EXISTS public.nfe_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cancelamento','cce','inutilizacao','manifestacao','consulta','reenvio')),
  protocolo TEXT,
  motivo TEXT,
  xml_url TEXT,
  payload JSONB,
  status TEXT DEFAULT 'processando' CHECK (status IN ('processando','sucesso','erro')),
  mensagem TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe_eventos TO authenticated;
GRANT ALL ON public.nfe_eventos TO service_role;
ALTER TABLE public.nfe_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem eventos" ON public.nfe_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/gerente gerencia eventos" ON public.nfe_eventos FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_nfe_eventos_nota ON public.nfe_eventos(nota_fiscal_id);

CREATE TABLE IF NOT EXISTS public.nfe_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  request JSONB,
  response JSONB,
  http_status INTEGER,
  duracao_ms INTEGER,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.nfe_logs TO authenticated;
GRANT ALL ON public.nfe_logs TO service_role;
ALTER TABLE public.nfe_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem logs" ON public.nfe_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados inserem logs" ON public.nfe_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_nfe_logs_nota ON public.nfe_logs(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_nfe_logs_created ON public.nfe_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.nfe_sequencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
  modelo TEXT NOT NULL DEFAULT '55',
  serie INTEGER NOT NULL DEFAULT 1,
  ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao','producao')),
  ultimo_numero INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, modelo, serie, ambiente)
);
GRANT SELECT, INSERT, UPDATE ON public.nfe_sequencias TO authenticated;
GRANT ALL ON public.nfe_sequencias TO service_role;
ALTER TABLE public.nfe_sequencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem sequencias" ON public.nfe_sequencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/gerente gerencia sequencias" ON public.nfe_sequencias FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TABLE IF NOT EXISTS public.empresa_filiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matriz_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  inscricao_estadual TEXT,
  logradouro TEXT, numero TEXT, bairro TEXT, cidade TEXT, uf TEXT, cep TEXT,
  telefone TEXT, email TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_filiais TO authenticated;
GRANT ALL ON public.empresa_filiais TO service_role;
ALTER TABLE public.empresa_filiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem filiais" ON public.empresa_filiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/gerente gerencia filiais" ON public.empresa_filiais FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TRIGGER nfe_sequencias_set_updated_at BEFORE UPDATE ON public.nfe_sequencias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER empresa_filiais_set_updated_at BEFORE UPDATE ON public.empresa_filiais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.proximo_numero_nfe(
  _empresa_id UUID,
  _serie INTEGER DEFAULT 1,
  _modelo TEXT DEFAULT '55',
  _ambiente TEXT DEFAULT 'homologacao'
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_numero INTEGER;
BEGIN
  INSERT INTO public.nfe_sequencias (empresa_id, modelo, serie, ambiente, ultimo_numero)
  VALUES (_empresa_id, _modelo, _serie, _ambiente, 1)
  ON CONFLICT (empresa_id, modelo, serie, ambiente)
  DO UPDATE SET ultimo_numero = nfe_sequencias.ultimo_numero + 1, updated_at = now()
  RETURNING ultimo_numero INTO novo_numero;
  RETURN novo_numero;
END;
$$;