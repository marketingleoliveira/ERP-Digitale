
ALTER TABLE public.maquinas
  ADD COLUMN IF NOT EXISTS n_alimentadores integer,
  ADD COLUMN IF NOT EXISTS diametro numeric,
  ADD COLUMN IF NOT EXISTS finura numeric,
  ADD COLUMN IF NOT EXISTS disposicao_agulhas text,
  ADD COLUMN IF NOT EXISTS producao_media numeric,
  ADD COLUMN IF NOT EXISTS carga_agulhas jsonb NOT NULL DEFAULT '[]'::jsonb;
