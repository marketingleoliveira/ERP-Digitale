ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS alim_fio_1_fio_id uuid,
  ADD COLUMN IF NOT EXISTS alim_fio_2_fio_id uuid,
  ADD COLUMN IF NOT EXISTS alim_fio_3_fio_id uuid;