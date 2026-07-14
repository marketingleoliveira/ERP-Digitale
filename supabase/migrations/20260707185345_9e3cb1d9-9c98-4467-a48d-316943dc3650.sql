
-- Extend notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS finalidade TEXT NOT NULL DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS destinatario_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS emissor TEXT,
  ADD COLUMN IF NOT EXISTS chave_ref TEXT,
  ADD COLUMN IF NOT EXISTS valor_frete NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_outros NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo_embalagem TEXT,
  ADD COLUMN IF NOT EXISTS quantidade_emb NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peso_bruto NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peso_liquido NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transportadora_id UUID REFERENCES public.tinturarias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS frete_tipo TEXT,
  ADD COLUMN IF NOT EXISTS placa_veiculo TEXT,
  ADD COLUMN IF NOT EXISTS drawback TEXT;

-- Extend itens
ALTER TABLE public.notas_fiscais_itens
  ADD COLUMN IF NOT EXISTS cor_id UUID REFERENCES public.cores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estampa_id UUID REFERENCES public.estampas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variante_id UUID REFERENCES public.variantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unidade TEXT,
  ADD COLUMN IF NOT EXISTS quantidade_entrada NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_saida NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_embalagem NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_complementar NUMERIC(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_icms NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aliquota_icms NUMERIC(6,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_icms NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacao_lote TEXT;

-- Faturas
CREATE TABLE IF NOT EXISTS public.notas_fiscais_faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  dias INTEGER DEFAULT 0,
  parcelas INTEGER DEFAULT 1,
  intervalo INTEGER DEFAULT 0,
  vencimento DATE NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_complementar NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais_faturas TO authenticated;
GRANT ALL ON public.notas_fiscais_faturas TO service_role;
ALTER TABLE public.notas_fiscais_faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nf_faturas_auth_all" ON public.notas_fiscais_faturas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_nf_faturas_nf ON public.notas_fiscais_faturas(nota_fiscal_id);
