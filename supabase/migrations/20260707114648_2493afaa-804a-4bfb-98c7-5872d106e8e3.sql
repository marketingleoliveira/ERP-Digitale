
CREATE TABLE IF NOT EXISTS public.composicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('Artigo','Fio')),
  codigo text NOT NULL,
  ncm text,
  composicao text NOT NULL,
  habilitado boolean NOT NULL DEFAULT true,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.composicoes TO authenticated;
GRANT ALL ON public.composicoes TO service_role;

ALTER TABLE public.composicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read composicoes" ON public.composicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert composicoes" ON public.composicoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth update composicoes" ON public.composicoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete composicoes" ON public.composicoes FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_composicoes_updated BEFORE UPDATE ON public.composicoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
