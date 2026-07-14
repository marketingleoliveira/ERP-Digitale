
CREATE TABLE public.estampas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  estampa TEXT NOT NULL,
  variante INTEGER NOT NULL DEFAULT 1 CHECK (variante >= 1),
  habilitado BOOLEAN NOT NULL DEFAULT true,
  imagem_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estampas TO authenticated;
GRANT ALL ON public.estampas TO service_role;

ALTER TABLE public.estampas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver estampas" ON public.estampas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem inserir estampas" ON public.estampas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados podem atualizar estampas" ON public.estampas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados podem excluir estampas" ON public.estampas
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER estampas_set_updated_at
BEFORE UPDATE ON public.estampas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX estampas_estampa_idx ON public.estampas (estampa);
