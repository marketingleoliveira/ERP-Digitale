ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS ncm text,
  ADD COLUMN IF NOT EXISTS rendimento numeric;