
-- Transportadoras
CREATE TABLE public.transportadoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  contato text,
  telefone text,
  email text,
  modal text DEFAULT 'rodoviario',
  prazo_medio_dias integer,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transportadoras TO authenticated;
GRANT ALL ON public.transportadoras TO service_role;
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read transportadoras" ON public.transportadoras FOR SELECT TO authenticated USING (true);
CREATE POLICY "gerente manage transportadoras" ON public.transportadoras FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'logistica'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'logistica'));
CREATE TRIGGER trg_transportadoras_updated BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Expedições / Romaneios
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  transportadora_id uuid REFERENCES public.transportadoras(id) ON DELETE SET NULL,
  data_saida date,
  previsao_entrega date,
  data_entrega date,
  volumes integer DEFAULT 1,
  peso_kg numeric(10,3),
  frete_valor numeric(12,2),
  rastreio text,
  status text NOT NULL DEFAULT 'preparando',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read shipments" ON public.shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "gerente manage shipments" ON public.shipments FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'logistica'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'logistica'));
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contas bancárias
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  banco text,
  agencia text,
  conta text,
  tipo text DEFAULT 'corrente',
  saldo_inicial numeric(14,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read bank" ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "fin manage bank" ON public.bank_accounts FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_bank_updated BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Movimentos de caixa
CREATE TABLE public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL,
  categoria text,
  descricao text NOT NULL,
  valor numeric(14,2) NOT NULL,
  documento text,
  conciliado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cash" ON public.cash_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "fin manage cash" ON public.cash_movements FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_cash_updated BEFORE UPDATE ON public.cash_movements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
