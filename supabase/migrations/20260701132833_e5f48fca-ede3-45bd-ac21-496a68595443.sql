
-- =========== ROLES & PROFILES ===========
CREATE TYPE public.app_role AS ENUM ('admin','gerente','vendedor','producao','financeiro','logistica','qualidade');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT,
  telefone TEXT,
  avatar_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select all auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles select own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_gerente(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','gerente'));
$$;

-- Extend user_roles select for admin/gerente
CREATE POLICY "user_roles select admin" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "user_roles manage admin" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'cargo'
  );

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reusable updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== CLIENTES ===========
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT UNIQUE,
  inscricao_estadual TEXT,
  segmento TEXT,
  email TEXT,
  telefone TEXT,
  cep TEXT, endereco TEXT, cidade TEXT, uf TEXT,
  limite_credito NUMERIC(14,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers select auth" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers insert auth" ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers update mgmt or owner" ON public.customers FOR UPDATE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "customers delete admin" ON public.customers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== FORNECEDORES ===========
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT UNIQUE,
  categoria TEXT,
  email TEXT, telefone TEXT,
  cep TEXT, endereco TEXT, cidade TEXT, uf TEXT,
  contato_principal TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers select auth" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers manage mgmt" ON public.suppliers FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== REPRESENTANTES ===========
CREATE TABLE public.sales_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT, telefone TEXT,
  regiao TEXT,
  comissao_pct NUMERIC(5,2) DEFAULT 0,
  meta_mensal NUMERIC(14,2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_reps TO authenticated;
GRANT ALL ON public.sales_reps TO service_role;
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_reps select auth" ON public.sales_reps FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_reps manage mgmt" ON public.sales_reps FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_sales_reps_updated BEFORE UPDATE ON public.sales_reps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== PRODUTOS ===========
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT,
  tipo TEXT, -- tecido, malha, estampa, peca
  composicao TEXT,
  gramatura NUMERIC(8,2),
  largura NUMERIC(8,2),
  unidade TEXT DEFAULT 'MT',
  preco_custo NUMERIC(14,2) DEFAULT 0,
  preco_venda NUMERIC(14,2) DEFAULT 0,
  ncm TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products select auth" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products manage mgmt" ON public.products FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  cor TEXT,
  tamanho TEXT,
  estoque NUMERIC(14,3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(14,3) NOT NULL DEFAULT 0,
  localizacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants select auth" ON public.product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "variants manage mgmt" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== PEDIDOS DE VENDA ===========
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  sales_rep_id UUID REFERENCES public.sales_reps(id),
  owner_id UUID REFERENCES auth.users(id),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_entrega DATE,
  status TEXT NOT NULL DEFAULT 'orcamento', -- orcamento, aprovado, producao, faturado, entregue, cancelado
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(14,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders select auth" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders insert auth" ON public.sales_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orders update mgmt or owner" ON public.sales_orders FOR UPDATE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "orders delete admin" ON public.sales_orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id),
  product_id UUID REFERENCES public.products(id),
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL,
  preco_unitario NUMERIC(14,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_items TO authenticated;
GRANT ALL ON public.sales_order_items TO service_role;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items select auth" ON public.sales_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items manage auth" ON public.sales_order_items FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- =========== ORDENS DE PRODUÇÃO (PCP) ===========
CREATE TABLE public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  product_id UUID REFERENCES public.products(id),
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL,
  data_inicio DATE,
  data_prevista DATE,
  data_conclusao DATE,
  estagio TEXT NOT NULL DEFAULT 'fila', -- fila, corte, estampa, costura, acabamento, qualidade, concluido
  prioridade TEXT DEFAULT 'normal',
  responsavel_id UUID REFERENCES auth.users(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_orders TO authenticated;
GRANT ALL ON public.production_orders TO service_role;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod select auth" ON public.production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod manage prod" ON public.production_orders FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'producao'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'producao'));
CREATE TRIGGER trg_prod_updated BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== FINANCEIRO ===========
CREATE TABLE public.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  sales_order_id UUID REFERENCES public.sales_orders(id),
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
  forma_pagamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts_receivable TO authenticated;
GRANT ALL ON public.accounts_receivable TO service_role;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar select auth" ON public.accounts_receivable FOR SELECT TO authenticated USING (true);
CREATE POLICY "ar manage fin" ON public.accounts_receivable FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_ar_updated BEFORE UPDATE ON public.accounts_receivable FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id),
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts_payable TO authenticated;
GRANT ALL ON public.accounts_payable TO service_role;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ap select auth" ON public.accounts_payable FOR SELECT TO authenticated USING (true);
CREATE POLICY "ap manage fin" ON public.accounts_payable FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()) OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_ap_updated BEFORE UPDATE ON public.accounts_payable FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX ON public.customers (owner_id);
CREATE INDEX ON public.sales_orders (customer_id);
CREATE INDEX ON public.sales_orders (status);
CREATE INDEX ON public.sales_order_items (order_id);
CREATE INDEX ON public.product_variants (product_id);
CREATE INDEX ON public.production_orders (estagio);
CREATE INDEX ON public.accounts_receivable (status);
CREATE INDEX ON public.accounts_payable (status);
