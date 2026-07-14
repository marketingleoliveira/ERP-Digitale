-- Tabela empresa (emissor) - singleton via unique constraint em cnpj
CREATE TABLE public.empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL UNIQUE,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT NOT NULL DEFAULT 'simples' CHECK (regime_tributario IN ('simples','presumido','real','mei')),
  cnae TEXT,
  -- endereço
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  codigo_municipio TEXT,
  pais TEXT DEFAULT 'Brasil',
  -- contato
  telefone TEXT,
  email TEXT,
  -- NFe / SEFAZ
  ambiente_nfe TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente_nfe IN ('homologacao','producao')),
  serie_nfe INTEGER DEFAULT 1,
  proximo_numero_nfe INTEGER DEFAULT 1,
  provedor_nfe TEXT CHECK (provedor_nfe IN ('focus_nfe','plugnotas','nenhum')) DEFAULT 'nenhum',
  logo_url TEXT,
  certificado_a1_nome TEXT,
  certificado_a1_validade DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa TO authenticated;
GRANT ALL ON public.empresa TO service_role;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem empresa" ON public.empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/gerente gerencia empresa" ON public.empresa FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TRIGGER empresa_set_updated_at BEFORE UPDATE ON public.empresa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Campos SEFAZ na nota fiscal
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS chave_acesso TEXT,
  ADD COLUMN IF NOT EXISTS protocolo_autorizacao TEXT,
  ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_sefaz TEXT DEFAULT 'rascunho' CHECK (status_sefaz IN ('rascunho','processando','autorizada','rejeitada','cancelada','denegada')),
  ADD COLUMN IF NOT EXISTS mensagem_sefaz TEXT,
  ADD COLUMN IF NOT EXISTS xml_url TEXT,
  ADD COLUMN IF NOT EXISTS danfe_url TEXT,
  ADD COLUMN IF NOT EXISTS provedor_ref TEXT;