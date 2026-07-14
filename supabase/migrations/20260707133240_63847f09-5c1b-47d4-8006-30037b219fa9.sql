
CREATE TABLE IF NOT EXISTS public.tinturarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  cnpj TEXT,
  telefone TEXT,
  contato TEXT,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tinturarias TO authenticated;
GRANT ALL ON public.tinturarias TO service_role;
ALTER TABLE public.tinturarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tinturarias" ON public.tinturarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write tinturarias" ON public.tinturarias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update tinturarias" ON public.tinturarias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete tinturarias" ON public.tinturarias FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_tinturarias_updated BEFORE UPDATE ON public.tinturarias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.cores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,
  cor TEXT NOT NULL,
  valor NUMERIC DEFAULT 0,
  valor_complementar NUMERIC DEFAULT 0,
  tinturaria_id UUID REFERENCES public.tinturarias(id) ON DELETE SET NULL,
  observacao TEXT,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cores TO authenticated;
GRANT ALL ON public.cores TO service_role;
ALTER TABLE public.cores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cores" ON public.cores FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write cores" ON public.cores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update cores" ON public.cores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete cores" ON public.cores FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_cores_updated BEFORE UPDATE ON public.cores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_cores_tinturaria ON public.cores(tinturaria_id);
