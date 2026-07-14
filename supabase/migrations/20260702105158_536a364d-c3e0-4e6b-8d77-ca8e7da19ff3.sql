
-- Facções (parceiros terceirizados)
CREATE TABLE public.faccoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  responsavel text,
  telefone text,
  email text,
  cidade text,
  uf text,
  especialidade text,
  capacidade_mensal numeric,
  custo_peca numeric,
  prazo_medio_dias integer,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faccoes TO authenticated;
GRANT ALL ON public.faccoes TO service_role;
ALTER TABLE public.faccoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faccoes select auth" ON public.faccoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "faccoes write admin/gerente" ON public.faccoes FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER faccoes_updated_at BEFORE UPDATE ON public.faccoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Envios/retornos para facções
CREATE TABLE public.faccao_ordens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial NOT NULL,
  faccao_id uuid NOT NULL REFERENCES public.faccoes(id) ON DELETE RESTRICT,
  production_order_id uuid REFERENCES public.production_orders(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  quantidade_enviada numeric NOT NULL DEFAULT 0,
  quantidade_retornada numeric NOT NULL DEFAULT 0,
  perdas numeric NOT NULL DEFAULT 0,
  custo_total numeric NOT NULL DEFAULT 0,
  data_envio date,
  data_prevista date,
  data_retorno date,
  status text NOT NULL DEFAULT 'enviado',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faccao_ordens TO authenticated;
GRANT ALL ON public.faccao_ordens TO service_role;
ALTER TABLE public.faccao_ordens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faccao_ordens select auth" ON public.faccao_ordens FOR SELECT TO authenticated USING (true);
CREATE POLICY "faccao_ordens write auth" ON public.faccao_ordens FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE TRIGGER faccao_ordens_updated_at BEFORE UPDATE ON public.faccao_ordens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Inspeções de qualidade
CREATE TABLE public.quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial NOT NULL,
  tipo text NOT NULL DEFAULT 'producao',
  production_order_id uuid REFERENCES public.production_orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  lote text,
  quantidade_inspecionada numeric NOT NULL DEFAULT 0,
  quantidade_aprovada numeric NOT NULL DEFAULT 0,
  quantidade_rejeitada numeric NOT NULL DEFAULT 0,
  defeito text,
  acao_corretiva text,
  resultado text NOT NULL DEFAULT 'pendente',
  inspetor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data_inspecao date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_inspections TO authenticated;
GRANT ALL ON public.quality_inspections TO service_role;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quality select auth" ON public.quality_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "quality write auth" ON public.quality_inspections FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE TRIGGER quality_updated_at BEFORE UPDATE ON public.quality_inspections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
