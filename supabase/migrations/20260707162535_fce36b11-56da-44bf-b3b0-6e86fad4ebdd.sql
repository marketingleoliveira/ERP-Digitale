
CREATE TABLE public.cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  permissoes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cargos_select_authenticated" ON public.cargos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cargos_dev_insert" ON public.cargos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "cargos_dev_update" ON public.cargos
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor')) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "cargos_dev_delete" ON public.cargos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE TRIGGER cargos_set_updated_at BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, cargo_id)
);
CREATE INDEX user_cargos_user_id_idx ON public.user_cargos(user_id);
CREATE INDEX user_cargos_cargo_id_idx ON public.user_cargos(cargo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cargos TO authenticated;
GRANT ALL ON public.user_cargos TO service_role;
ALTER TABLE public.user_cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_cargos_select_own_or_dev" ON public.user_cargos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "user_cargos_dev_insert" ON public.user_cargos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "user_cargos_dev_update" ON public.user_cargos
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor')) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "user_cargos_dev_delete" ON public.user_cargos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE OR REPLACE FUNCTION public.user_has_menu_permission(_user_id uuid, _url text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'desenvolvedor')
    OR EXISTS (
      SELECT 1
      FROM public.user_cargos uc
      JOIN public.cargos c ON c.id = uc.cargo_id
      WHERE uc.user_id = _user_id AND _url = ANY(c.permissoes)
    );
$$;
