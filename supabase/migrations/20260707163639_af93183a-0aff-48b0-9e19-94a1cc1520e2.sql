
CREATE TABLE public.funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text,
  cpf text,
  telefone text,
  celular text,
  habilitado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX funcionarios_nome_idx ON public.funcionarios(nome);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionarios TO authenticated;
GRANT ALL ON public.funcionarios TO service_role;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funcionarios_select_auth" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "funcionarios_insert_auth" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "funcionarios_update_auth" ON public.funcionarios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "funcionarios_delete_auth" ON public.funcionarios FOR DELETE TO authenticated USING (true);

CREATE TRIGGER funcionarios_set_updated_at BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
