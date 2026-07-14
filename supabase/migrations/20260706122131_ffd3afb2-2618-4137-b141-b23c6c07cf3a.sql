
-- 1) Articles table
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  nome text NOT NULL,
  slug text UNIQUE,
  categoria text,
  composicao text,
  gramatura numeric,
  largura numeric,
  tecnologias text[],
  descricao_curta text,
  descricao text,
  imagem_url text,
  preco_venda numeric,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles select auth" ON public.articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "articles insert mgmt" ON public.articles FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "articles update mgmt" ON public.articles FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "articles delete dev" ON public.articles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));
CREATE TRIGGER articles_set_updated BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Restrict deletes to desenvolvedor only on cadastros tables
DROP POLICY IF EXISTS "customers delete admin" ON public.customers;
CREATE POLICY "customers delete dev" ON public.customers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));

DROP POLICY IF EXISTS "products manage mgmt" ON public.products;
CREATE POLICY "products insert mgmt" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "products update mgmt" ON public.products FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "products delete dev" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));

DROP POLICY IF EXISTS "sales_reps manage mgmt" ON public.sales_reps;
CREATE POLICY "sales_reps insert mgmt" ON public.sales_reps FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "sales_reps update mgmt" ON public.sales_reps FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "sales_reps delete dev" ON public.sales_reps FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));

DROP POLICY IF EXISTS "suppliers manage mgmt" ON public.suppliers;
CREATE POLICY "suppliers insert mgmt" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "suppliers update mgmt" ON public.suppliers FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "suppliers delete dev" ON public.suppliers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));

DROP POLICY IF EXISTS "gerente manage transportadoras" ON public.transportadoras;
CREATE POLICY "transportadoras insert mgmt" ON public.transportadoras FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "transportadoras update mgmt" ON public.transportadoras FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE POLICY "transportadoras delete dev" ON public.transportadoras FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::app_role));

-- 3) Seed initial articles (Digitale fabrics)
INSERT INTO public.articles (codigo, nome, slug, categoria, descricao_curta) VALUES
('ART-MIL', 'Milano', 'milano', 'Poliamida', 'Tecido de alta compressão, ideal para leggings e shorts fitness.'),
('ART-LYO', 'Lyon', 'lyon', 'Poliamida', 'Malha com toque suave e caimento perfeito.'),
('ART-AER', 'Aerodry', 'aerodry', 'Poliamida', 'Tecnologia dry fit avançada com secagem ultra-rápida.'),
('ART-VEN', 'Veneza', 'veneza', 'Supermicrofibra', 'Elegância e conforto em cada detalhe.'),
('ART-OCE', 'Oceanic', 'oceanic', 'Moda Praia', 'Tecido leve com alta resistência ao cloro e sal.'),
('ART-OCE-E', 'Oceanic Eco', 'oceanic-eco', 'Moda Praia ECO', 'Linha sustentável com fios reciclados.'),
('ART-SOF', 'Softskin', 'softskin', 'Supermicrofibra', 'Toque ultra macio e conforto premium.'),
('ART-INT', 'Intense', 'intense', 'Poliamida', 'Alta densidade para performance intensa.'),
('ART-COR', 'Corsega', 'corsega', 'Supermicrofibra', 'Caimento perfeito para roupas fitness.'),
('ART-VEL', 'Velocity', 'velocity', 'Poliamida', 'Leveza e velocidade para atletas.'),
('ART-FLO', 'Flow', 'flow', 'Supermicrofibra', 'Fluidez e movimento em cada peça.'),
('ART-CAR', 'Caribe', 'caribe', 'Moda Praia', 'Cores vivas e resistência para beachwear.'),
('ART-PAR', 'Paris', 'paris', 'Supermicrofibra', 'Sofisticação e brilho intenso.');
