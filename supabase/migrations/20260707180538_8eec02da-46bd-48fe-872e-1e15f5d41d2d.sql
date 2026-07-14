
CREATE TABLE public.correias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  correia TEXT NOT NULL,
  modelo TEXT,
  marca TEXT,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.correias TO authenticated;
GRANT ALL ON public.correias TO service_role;
ALTER TABLE public.correias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read correias" ON public.correias FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert correias" ON public.correias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update correias" ON public.correias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated delete correias" ON public.correias FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_correias_updated BEFORE UPDATE ON public.correias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
