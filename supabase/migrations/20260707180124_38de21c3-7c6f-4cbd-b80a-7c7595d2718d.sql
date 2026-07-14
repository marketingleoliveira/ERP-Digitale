ALTER TABLE public.maquinas
  ADD COLUMN IF NOT EXISTS data_fabricacao date,
  ADD COLUMN IF NOT EXISTS correias text[] NOT NULL DEFAULT ARRAY[]::text[];