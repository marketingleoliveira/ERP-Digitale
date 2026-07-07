
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS alim_fio_1_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alim_fio_1_lfa numeric,
  ADD COLUMN IF NOT EXISTS alim_fio_1_tensao numeric,
  ADD COLUMN IF NOT EXISTS alim_fio_2_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alim_fio_2_lfa numeric,
  ADD COLUMN IF NOT EXISTS alim_fio_2_tensao numeric,
  ADD COLUMN IF NOT EXISTS alim_fio_3_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alim_fio_3_lfa numeric,
  ADD COLUMN IF NOT EXISTS alim_fio_3_tensao numeric;
