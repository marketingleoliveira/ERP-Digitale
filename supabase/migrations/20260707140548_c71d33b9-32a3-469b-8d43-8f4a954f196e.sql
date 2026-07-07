
-- 1) New columns on articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS peso_peca_kg numeric,
  ADD COLUMN IF NOT EXISTS peca_tara_kg numeric,
  ADD COLUMN IF NOT EXISTS qtd_agulhas_cilindro integer,
  ADD COLUMN IF NOT EXISTS qtd_agulhas_disco integer,
  ADD COLUMN IF NOT EXISTS alimentador_fio_1 text,
  ADD COLUMN IF NOT EXISTS alimentador_fio_2 text,
  ADD COLUMN IF NOT EXISTS alimentador_fio_3 text,
  ADD COLUMN IF NOT EXISTS ponto_disco text,
  ADD COLUMN IF NOT EXISTS ponto_cilindro text,
  ADD COLUMN IF NOT EXISTS roda_1 numeric,
  ADD COLUMN IF NOT EXISTS roda_2 numeric,
  ADD COLUMN IF NOT EXISTS roda_lycra numeric,
  ADD COLUMN IF NOT EXISTS altura_disco numeric,
  ADD COLUMN IF NOT EXISTS tensao_lycra numeric,
  ADD COLUMN IF NOT EXISTS tensao_fio numeric,
  ADD COLUMN IF NOT EXISTS r_lucro numeric,
  ADD COLUMN IF NOT EXISTS owner_id uuid;

-- 2) Lavagens do artigo
CREATE TABLE IF NOT EXISTS public.article_lavagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  lavagem text NOT NULL,
  simbolo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_article_lavagens_article ON public.article_lavagens(article_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_lavagens TO authenticated;
GRANT ALL ON public.article_lavagens TO service_role;
ALTER TABLE public.article_lavagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_lavagens read"
  ON public.article_lavagens FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id
      AND (a.owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())))
  );
CREATE POLICY "article_lavagens write"
  ON public.article_lavagens FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id
      AND (a.owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id
      AND (a.owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())))
  );

-- 3) Cores do artigo
CREATE TABLE IF NOT EXISTS public.article_cores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  cor_id uuid REFERENCES public.cores(id) ON DELETE SET NULL,
  cor_descricao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_article_cores_article ON public.article_cores(article_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_cores TO authenticated;
GRANT ALL ON public.article_cores TO service_role;
ALTER TABLE public.article_cores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_cores read"
  ON public.article_cores FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id
      AND (a.owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())))
  );
CREATE POLICY "article_cores write"
  ON public.article_cores FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id
      AND (a.owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id
      AND (a.owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())))
  );
