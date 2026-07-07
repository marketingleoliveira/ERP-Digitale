
CREATE TABLE IF NOT EXISTS public.fios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  ncm text,
  tipo text,
  titulo numeric,
  n_filamentos integer,
  n_cabos integer,
  composicao text,
  habilitado boolean NOT NULL DEFAULT true,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fios TO authenticated;
GRANT ALL ON public.fios TO service_role;

ALTER TABLE public.fios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read fios" ON public.fios FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert fios" ON public.fios FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth update fios" ON public.fios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete fios" ON public.fios FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_fios_updated BEFORE UPDATE ON public.fios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
