
CREATE TABLE public.maquinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL UNIQUE,
  tipo text NOT NULL,
  maquina text NOT NULL,
  modelo text,
  habilitado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquinas TO authenticated;
GRANT ALL ON public.maquinas TO service_role;

ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read maquinas" ON public.maquinas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert maquinas" ON public.maquinas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update maquinas" ON public.maquinas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete maquinas" ON public.maquinas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER maquinas_set_updated_at BEFORE UPDATE ON public.maquinas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX maquinas_numero_idx ON public.maquinas(numero);
