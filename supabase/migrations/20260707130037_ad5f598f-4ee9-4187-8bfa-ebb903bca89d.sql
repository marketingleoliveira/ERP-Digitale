
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cest text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS estoque_minimo numeric,
  ADD COLUMN IF NOT EXISTS img1_path text,
  ADD COLUMN IF NOT EXISTS img2_path text,
  ADD COLUMN IF NOT EXISTS observacao text,
  ADD COLUMN IF NOT EXISTS rendimento numeric,
  ADD COLUMN IF NOT EXISTS area_peca numeric,
  ADD COLUMN IF NOT EXISTS qtd_pecas_kg numeric,
  ADD COLUMN IF NOT EXISTS peso_padrao_peca numeric,
  ADD COLUMN IF NOT EXISTS ficha_tecnica jsonb NOT NULL DEFAULT '[]'::jsonb;
