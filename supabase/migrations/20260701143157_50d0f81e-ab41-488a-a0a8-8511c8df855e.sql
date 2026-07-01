
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','transferencia')),
  quantidade numeric NOT NULL,
  origem text, destino text, documento text, observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read stock" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert stock" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "manage stock" ON public.stock_movements FOR ALL TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero bigserial UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  data_emissao date NOT NULL DEFAULT current_date,
  data_prevista date,
  valor_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberto',
  observacoes text,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read po" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert po" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "manage po" ON public.purchase_orders FOR ALL TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL, empresa text, email text, telefone text,
  origem text, estagio text NOT NULL DEFAULT 'novo',
  valor_estimado numeric, proxima_acao date, observacoes text,
  owner_id uuid REFERENCES auth.users(id),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read leads" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert leads" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update leads" ON public.crm_leads FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid())) WITH CHECK (owner_id = auth.uid() OR public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "delete leads" ON public.crm_leads FOR DELETE TO authenticated USING (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
