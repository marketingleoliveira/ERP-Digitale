
CREATE TABLE public.variantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.variantes TO authenticated;
GRANT ALL ON public.variantes TO service_role;

ALTER TABLE public.variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver variantes" ON public.variantes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem inserir variantes" ON public.variantes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados podem atualizar variantes" ON public.variantes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados podem excluir variantes" ON public.variantes
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER variantes_set_updated_at
BEFORE UPDATE ON public.variantes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX variantes_nome_idx ON public.variantes (nome);
