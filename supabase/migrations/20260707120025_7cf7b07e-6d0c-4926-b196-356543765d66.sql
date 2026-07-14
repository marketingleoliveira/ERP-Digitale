
ALTER TABLE public.fios
  ADD COLUMN IF NOT EXISTS cest text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS quebra_percent numeric,
  ADD COLUMN IF NOT EXISTS custo numeric,
  ADD COLUMN IF NOT EXISTS cor text,
  ADD COLUMN IF NOT EXISTS composicao_id uuid REFERENCES public.composicoes(id) ON DELETE SET NULL;
