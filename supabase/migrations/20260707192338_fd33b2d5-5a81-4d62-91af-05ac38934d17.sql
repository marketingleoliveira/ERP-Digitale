
-- Enum com 'cancelada' incluída
DO $$ BEGIN
  CREATE TYPE public.op_status AS ENUM (
    'planejada','programada','em_producao','parcial',
    'aguardando_qualidade','reprovada','aprovada',
    'pronta_estoque','pronta_faturamento','faturada','expedida','encerrada','cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  cliente_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  vendedor_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  data_pedido date NOT NULL DEFAULT CURRENT_DATE,
  prazo_entrega date,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','confirmado','cancelado','faturado')),
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  condicao_pagamento text,
  observacao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos_read" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pedidos_write" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pedidos_update" ON public.pedidos FOR UPDATE TO authenticated USING (public.is_admin_or_gerente(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "pedidos_delete" ON public.pedidos FOR DELETE TO authenticated USING (public.is_admin_or_gerente(auth.uid()));

-- 2. PEDIDO_ITENS
CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  variante_id uuid REFERENCES public.variantes(id) ON DELETE SET NULL,
  cor_id uuid REFERENCES public.cores(id) ON DELETE SET NULL,
  estampa_id uuid REFERENCES public.estampas(id) ON DELETE SET NULL,
  descricao text,
  quantidade numeric(14,3) NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'UN',
  valor_unitario numeric(14,4) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.pedido_itens(pedido_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedido_itens_all" ON public.pedido_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ORDENS_PRODUCAO
CREATE TABLE IF NOT EXISTS public.ordens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL UNIQUE,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  status public.op_status NOT NULL DEFAULT 'planejada',
  prioridade integer NOT NULL DEFAULT 5 CHECK (prioridade BETWEEN 1 AND 10),
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_prevista date,
  data_conclusao timestamptz,
  maquina_id uuid REFERENCES public.maquinas(id) ON DELETE SET NULL,
  funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  responsavel_id uuid,
  observacao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ordens_producao(status);
CREATE INDEX ON public.ordens_producao(pedido_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_producao TO authenticated;
GRANT ALL ON public.ordens_producao TO service_role;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_read" ON public.ordens_producao FOR SELECT TO authenticated USING (true);
CREATE POLICY "op_insert" ON public.ordens_producao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "op_update" ON public.ordens_producao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "op_delete" ON public.ordens_producao FOR DELETE TO authenticated USING (public.is_admin_or_gerente(auth.uid()));

-- 4. OP_ITENS
CREATE TABLE IF NOT EXISTS public.op_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  pedido_item_id uuid REFERENCES public.pedido_itens(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  variante_id uuid REFERENCES public.variantes(id),
  cor_id uuid REFERENCES public.cores(id),
  estampa_id uuid REFERENCES public.estampas(id),
  descricao text,
  quantidade_planejada numeric(14,3) NOT NULL DEFAULT 0,
  quantidade_produzida numeric(14,3) NOT NULL DEFAULT 0,
  quantidade_aprovada numeric(14,3) NOT NULL DEFAULT 0,
  quantidade_reprovada numeric(14,3) NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'KG',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_itens(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_itens TO authenticated;
GRANT ALL ON public.op_itens TO service_role;
ALTER TABLE public.op_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_itens_all" ON public.op_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. OP_CONSUMOS
CREATE TABLE IF NOT EXISTS public.op_consumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  lote_id uuid REFERENCES public.lotes(id) ON DELETE SET NULL,
  quantidade numeric(14,3) NOT NULL,
  momento timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_consumos(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_consumos TO authenticated;
GRANT ALL ON public.op_consumos TO service_role;
ALTER TABLE public.op_consumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_consumos_all" ON public.op_consumos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. OP_APONTAMENTOS
CREATE TABLE IF NOT EXISTS public.op_apontamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  funcionario_id uuid REFERENCES public.funcionarios(id),
  maquina_id uuid REFERENCES public.maquinas(id),
  inicio timestamptz NOT NULL,
  fim timestamptz,
  quantidade_produzida numeric(14,3) NOT NULL DEFAULT 0,
  quantidade_refugo numeric(14,3) NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_apontamentos(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_apontamentos TO authenticated;
GRANT ALL ON public.op_apontamentos TO service_role;
ALTER TABLE public.op_apontamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_apontamentos_all" ON public.op_apontamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. OP_QUALIDADE
CREATE TABLE IF NOT EXISTS public.op_qualidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  inspetor_id uuid REFERENCES public.funcionarios(id),
  resultado text NOT NULL CHECK (resultado IN ('aprovado','reprovado','parcial')),
  quantidade_aprovada numeric(14,3) NOT NULL DEFAULT 0,
  quantidade_reprovada numeric(14,3) NOT NULL DEFAULT 0,
  motivo text,
  data timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_qualidade(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_qualidade TO authenticated;
GRANT ALL ON public.op_qualidade TO service_role;
ALTER TABLE public.op_qualidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_qualidade_all" ON public.op_qualidade FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. OP_ENTRADAS_ESTOQUE
CREATE TABLE IF NOT EXISTS public.op_entradas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  variante_id uuid REFERENCES public.variantes(id),
  lote_id uuid REFERENCES public.lotes(id) ON DELETE SET NULL,
  quantidade numeric(14,3) NOT NULL,
  data_entrada timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_entradas_estoque(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_entradas_estoque TO authenticated;
GRANT ALL ON public.op_entradas_estoque TO service_role;
ALTER TABLE public.op_entradas_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_entradas_all" ON public.op_entradas_estoque FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. OP_EVENTOS
CREATE TABLE IF NOT EXISTS public.op_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  de_status public.op_status,
  para_status public.op_status,
  payload jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_eventos(op_id);
GRANT SELECT, INSERT ON public.op_eventos TO authenticated;
GRANT ALL ON public.op_eventos TO service_role;
ALTER TABLE public.op_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_eventos_read" ON public.op_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "op_eventos_insert" ON public.op_eventos FOR INSERT TO authenticated WITH CHECK (true);

-- 10. OP_FATURAMENTO
CREATE TABLE IF NOT EXISTS public.op_faturamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  nota_fiscal_id uuid REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  quantidade_faturada numeric(14,3) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pre_faturado','faturado','expedido','cancelado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_faturamento(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_faturamento TO authenticated;
GRANT ALL ON public.op_faturamento TO service_role;
ALTER TABLE public.op_faturamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_faturamento_all" ON public.op_faturamento FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. OP_EXPEDICOES
CREATE TABLE IF NOT EXISTS public.op_expedicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  nota_fiscal_id uuid REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  transportadora_id uuid REFERENCES public.tinturarias(id) ON DELETE SET NULL,
  data_saida timestamptz,
  data_entrega timestamptz,
  rastreio text,
  status text NOT NULL DEFAULT 'preparando' CHECK (status IN ('preparando','saiu','entregue','devolvido')),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.op_expedicoes(op_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_expedicoes TO authenticated;
GRANT ALL ON public.op_expedicoes TO service_role;
ALTER TABLE public.op_expedicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_expedicoes_all" ON public.op_expedicoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Extensões
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS op_id uuid REFERENCES public.ordens_producao(id) ON DELETE SET NULL;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS op_id uuid REFERENCES public.ordens_producao(id) ON DELETE SET NULL;
ALTER TABLE public.empresa ADD COLUMN IF NOT EXISTS exige_op_para_nfe boolean NOT NULL DEFAULT false;

-- Numeração atômica
CREATE SEQUENCE IF NOT EXISTS public.seq_op_numero START 1;
CREATE OR REPLACE FUNCTION public.proximo_numero_op()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT nextval('public.seq_op_numero')::integer; $$;

-- Máquina de estados
CREATE OR REPLACE FUNCTION public.op_transicao_valida(_de public.op_status, _para public.op_status)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT (_de, _para) IN (
    ('planejada'::public.op_status,'programada'::public.op_status),
    ('planejada','cancelada'),
    ('programada','em_producao'),
    ('programada','cancelada'),
    ('em_producao','parcial'),
    ('em_producao','aguardando_qualidade'),
    ('parcial','aguardando_qualidade'),
    ('parcial','em_producao'),
    ('aguardando_qualidade','aprovada'),
    ('aguardando_qualidade','reprovada'),
    ('aguardando_qualidade','parcial'),
    ('reprovada','em_producao'),
    ('aprovada','pronta_estoque'),
    ('pronta_estoque','pronta_faturamento'),
    ('pronta_faturamento','faturada'),
    ('faturada','expedida'),
    ('expedida','encerrada')
  );
$$;

CREATE OR REPLACE FUNCTION public.op_transicionar(_op_id uuid, _novo_status public.op_status, _payload jsonb DEFAULT NULL)
RETURNS public.op_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE atual public.op_status;
BEGIN
  SELECT status INTO atual FROM public.ordens_producao WHERE id = _op_id FOR UPDATE;
  IF atual IS NULL THEN RAISE EXCEPTION 'OP % não encontrada', _op_id; END IF;
  IF atual = _novo_status THEN RETURN atual; END IF;
  IF NOT public.op_transicao_valida(atual, _novo_status) THEN
    RAISE EXCEPTION 'Transição inválida: % → %', atual, _novo_status;
  END IF;
  UPDATE public.ordens_producao SET status = _novo_status, updated_at = now() WHERE id = _op_id;
  RETURN _novo_status;
END; $$;

CREATE OR REPLACE FUNCTION public.on_op_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.op_eventos(op_id, tipo, de_status, para_status, user_id)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_op_status_change ON public.ordens_producao;
CREATE TRIGGER trg_op_status_change
AFTER UPDATE OF status ON public.ordens_producao
FOR EACH ROW EXECUTE FUNCTION public.on_op_status_change();

DROP TRIGGER IF EXISTS trg_pedidos_updated ON public.pedidos;
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_op_updated ON public.ordens_producao;
CREATE TRIGGER trg_op_updated BEFORE UPDATE ON public.ordens_producao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_op_fatur_updated ON public.op_faturamento;
CREATE TRIGGER trg_op_fatur_updated BEFORE UPDATE ON public.op_faturamento FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_op_exp_updated ON public.op_expedicoes;
CREATE TRIGGER trg_op_exp_updated BEFORE UPDATE ON public.op_expedicoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
