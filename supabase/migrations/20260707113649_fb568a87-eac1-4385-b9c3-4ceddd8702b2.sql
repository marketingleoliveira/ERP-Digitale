
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'BRASIL',
  ADD COLUMN IF NOT EXISTS suframa text,
  ADD COLUMN IF NOT EXISTS peca_tara_kg numeric,
  ADD COLUMN IF NOT EXISTS observacao_financeiro text,
  ADD COLUMN IF NOT EXISTS entrega_cep text,
  ADD COLUMN IF NOT EXISTS entrega_uf text,
  ADD COLUMN IF NOT EXISTS entrega_endereco text,
  ADD COLUMN IF NOT EXISTS entrega_numero text,
  ADD COLUMN IF NOT EXISTS entrega_complemento text,
  ADD COLUMN IF NOT EXISTS entrega_bairro text,
  ADD COLUMN IF NOT EXISTS entrega_cidade text,
  ADD COLUMN IF NOT EXISTS entrega_cidade_codigo text,
  ADD COLUMN IF NOT EXISTS segmento_cliente text,
  ADD COLUMN IF NOT EXISTS artigos_venda jsonb NOT NULL DEFAULT '[]'::jsonb;
