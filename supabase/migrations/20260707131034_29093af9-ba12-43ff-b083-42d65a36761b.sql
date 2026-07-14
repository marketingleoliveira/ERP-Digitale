
CREATE TABLE public.agulhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agulha text NOT NULL UNIQUE,
  modelo text,
  pe integer,
  marca text,
  habilitado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agulhas TO authenticated;
GRANT ALL ON public.agulhas TO service_role;

ALTER TABLE public.agulhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read agulhas" ON public.agulhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert agulhas" ON public.agulhas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update agulhas" ON public.agulhas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete agulhas" ON public.agulhas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER agulhas_set_updated_at BEFORE UPDATE ON public.agulhas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX agulhas_agulha_idx ON public.agulhas(agulha);
