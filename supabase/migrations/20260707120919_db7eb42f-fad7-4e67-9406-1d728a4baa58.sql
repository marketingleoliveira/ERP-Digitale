
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS cest text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS fci text,
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS p_acabamento text,
  ADD COLUMN IF NOT EXISTS lfa numeric,
  ADD COLUMN IF NOT EXISTS falha_agulha boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_maquina text,
  ADD COLUMN IF NOT EXISTS diametro numeric,
  ADD COLUMN IF NOT EXISTS finura numeric,
  ADD COLUMN IF NOT EXISTS n_alimentadores integer,
  ADD COLUMN IF NOT EXISTS disposicao_agulhas text,
  ADD COLUMN IF NOT EXISTS rpm numeric,
  ADD COLUMN IF NOT EXISTS n_voltas integer,
  ADD COLUMN IF NOT EXISTS r_malharia numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS r_malharia_compl numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS r_custo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS r_venda numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS r_venda_metros numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacao text;

CREATE TABLE IF NOT EXISTS public.article_fios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  fio_id uuid REFERENCES public.fios(id) ON DELETE SET NULL,
  fio_descricao text NOT NULL,
  qtd_cones numeric NOT NULL DEFAULT 0,
  porcentagem numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_fios_article_id_idx ON public.article_fios(article_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_fios TO authenticated;
GRANT ALL ON public.article_fios TO service_role;

ALTER TABLE public.article_fios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_fios select auth" ON public.article_fios FOR SELECT TO authenticated USING (true);
CREATE POLICY "article_fios insert mgmt" ON public.article_fios FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "article_fios update mgmt" ON public.article_fios FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "article_fios delete dev" ON public.article_fios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));

CREATE TRIGGER article_fios_set_updated BEFORE UPDATE ON public.article_fios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
