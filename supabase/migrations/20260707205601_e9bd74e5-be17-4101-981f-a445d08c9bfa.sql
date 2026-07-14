
-- ========== CENTROS DE CUSTO ==========
CREATE TABLE public.centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'despesa' CHECK (tipo IN ('receita','despesa','ambos')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;
GRANT ALL ON public.centros_custo TO service_role;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY cc_read ON public.centros_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY cc_write ON public.centros_custo FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_cc_upd BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== CONTAS BANCÁRIAS ==========
CREATE TABLE public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo TEXT NOT NULL DEFAULT 'corrente' CHECK (tipo IN ('corrente','poupanca','caixa','cartao','outros')),
  saldo_inicial NUMERIC(14,2) NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_bancarias TO authenticated;
GRANT ALL ON public.contas_bancarias TO service_role;
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY cb_read ON public.contas_bancarias FOR SELECT TO authenticated USING (true);
CREATE POLICY cb_write ON public.contas_bancarias FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_cb_upd BEFORE UPDATE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== MOVIMENTOS FINANCEIROS (livro-caixa) ==========
CREATE TABLE public.movimentos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','transferencia','ajuste')),
  origem TEXT NOT NULL CHECK (origem IN ('contas_pagar','contas_receber','producao','manual','conciliacao','transferencia')),
  valor NUMERIC(14,2) NOT NULL CHECK (valor >= 0),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  op_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  forma_pagamento TEXT,
  documento TEXT,
  descricao TEXT,
  conciliado BOOLEAN NOT NULL DEFAULT false,
  conciliado_em TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mf_data_idx ON public.movimentos_financeiros(data);
CREATE INDEX mf_conta_idx ON public.movimentos_financeiros(conta_bancaria_id);
CREATE INDEX mf_cp_idx ON public.movimentos_financeiros(conta_pagar_id);
CREATE INDEX mf_cr_idx ON public.movimentos_financeiros(conta_receber_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentos_financeiros TO authenticated;
GRANT ALL ON public.movimentos_financeiros TO service_role;
ALTER TABLE public.movimentos_financeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY mf_read ON public.movimentos_financeiros FOR SELECT TO authenticated USING (true);
CREATE POLICY mf_write ON public.movimentos_financeiros FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_mf_upd BEFORE UPDATE ON public.movimentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== EXTENSÕES em contas_pagar / contas_receber ==========
ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID REFERENCES public.centros_custo(id),
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS juros NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documento TEXT;

ALTER TABLE public.contas_receber
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID REFERENCES public.centros_custo(id),
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS juros NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documento TEXT;

-- ========== FUNÇÕES DE LIQUIDAÇÃO ==========
CREATE OR REPLACE FUNCTION public.liquidar_conta_pagar(
  _conta_id UUID,
  _valor_pago NUMERIC,
  _data DATE DEFAULT CURRENT_DATE,
  _conta_bancaria_id UUID DEFAULT NULL,
  _forma_pagamento TEXT DEFAULT NULL,
  _juros NUMERIC DEFAULT 0,
  _desconto NUMERIC DEFAULT 0,
  _observacao TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  mov_id UUID;
BEGIN
  SELECT * INTO c FROM public.contas_pagar WHERE id = _conta_id FOR UPDATE;
  IF c IS NULL THEN RAISE EXCEPTION 'Conta a pagar % não encontrada', _conta_id; END IF;
  IF c.status = 'paga' THEN RAISE EXCEPTION 'Conta já liquidada'; END IF;

  UPDATE public.contas_pagar
     SET status = 'paga', pago_em = now(), valor_pago = _valor_pago,
         juros = COALESCE(_juros,0), desconto = COALESCE(_desconto,0),
         conta_bancaria_id = COALESCE(_conta_bancaria_id, conta_bancaria_id),
         forma_pagamento = COALESCE(_forma_pagamento, forma_pagamento),
         observacao = COALESCE(_observacao, observacao),
         updated_at = now()
   WHERE id = _conta_id;

  INSERT INTO public.movimentos_financeiros(
    data, tipo, origem, valor, conta_bancaria_id, centro_custo_id,
    conta_pagar_id, forma_pagamento, documento, descricao, user_id
  ) VALUES (
    _data, 'saida', 'contas_pagar', _valor_pago, _conta_bancaria_id, c.centro_custo_id,
    _conta_id, _forma_pagamento, c.documento,
    'Liquidação: ' || c.descricao, auth.uid()
  ) RETURNING id INTO mov_id;

  RETURN mov_id;
END; $$;

CREATE OR REPLACE FUNCTION public.liquidar_conta_receber(
  _conta_id UUID,
  _valor_pago NUMERIC,
  _data DATE DEFAULT CURRENT_DATE,
  _conta_bancaria_id UUID DEFAULT NULL,
  _forma_pagamento TEXT DEFAULT NULL,
  _juros NUMERIC DEFAULT 0,
  _desconto NUMERIC DEFAULT 0,
  _observacao TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  mov_id UUID;
  novo_pago NUMERIC;
  novo_status TEXT;
BEGIN
  SELECT * INTO c FROM public.contas_receber WHERE id = _conta_id FOR UPDATE;
  IF c IS NULL THEN RAISE EXCEPTION 'Conta a receber % não encontrada', _conta_id; END IF;
  IF c.status = 'pago' THEN RAISE EXCEPTION 'Conta já liquidada'; END IF;

  novo_pago := COALESCE(c.valor_pago,0) + _valor_pago;
  novo_status := CASE WHEN novo_pago >= c.valor THEN 'pago' ELSE 'parcial' END;

  UPDATE public.contas_receber
     SET status = novo_status, valor_pago = novo_pago,
         pago_em = CASE WHEN novo_status='pago' THEN now() ELSE pago_em END,
         juros = COALESCE(juros,0) + COALESCE(_juros,0),
         desconto = COALESCE(desconto,0) + COALESCE(_desconto,0),
         conta_bancaria_id = COALESCE(_conta_bancaria_id, conta_bancaria_id),
         forma_pagamento = COALESCE(_forma_pagamento, forma_pagamento),
         updated_at = now()
   WHERE id = _conta_id;

  INSERT INTO public.movimentos_financeiros(
    data, tipo, origem, valor, conta_bancaria_id, centro_custo_id,
    conta_receber_id, forma_pagamento, documento, descricao, user_id
  ) VALUES (
    _data, 'entrada', 'contas_receber', _valor_pago, _conta_bancaria_id, c.centro_custo_id,
    _conta_id, _forma_pagamento, c.documento,
    'Recebimento: ' || COALESCE(c.descricao,''), auth.uid()
  ) RETURNING id INTO mov_id;

  RETURN mov_id;
END; $$;

-- ========== VIEW FLUXO DE CAIXA ==========
CREATE OR REPLACE VIEW public.vw_fluxo_caixa AS
SELECT
  data,
  'realizado'::text AS classe,
  tipo,
  origem,
  valor,
  conta_bancaria_id,
  centro_custo_id,
  descricao
FROM public.movimentos_financeiros
UNION ALL
SELECT
  vencimento AS data,
  'previsto'::text AS classe,
  'saida'::text AS tipo,
  'contas_pagar'::text AS origem,
  (valor + COALESCE(juros,0) - COALESCE(desconto,0)) AS valor,
  conta_bancaria_id,
  centro_custo_id,
  descricao
FROM public.contas_pagar WHERE status IN ('aberta','vencida')
UNION ALL
SELECT
  vencimento AS data,
  'previsto'::text AS classe,
  'entrada'::text AS tipo,
  'contas_receber'::text AS origem,
  (valor - COALESCE(valor_pago,0)) AS valor,
  conta_bancaria_id,
  centro_custo_id,
  descricao
FROM public.contas_receber WHERE status IN ('aberto','parcial');

GRANT SELECT ON public.vw_fluxo_caixa TO authenticated;

-- ========== SEED centros_custo padrão ==========
INSERT INTO public.centros_custo(codigo, nome, tipo) VALUES
  ('COMPRAS','Compras de Matéria-Prima','despesa'),
  ('PRODUCAO','Produção','despesa'),
  ('VENDAS','Vendas','receita'),
  ('ADM','Administrativo','despesa'),
  ('IMPOSTOS','Impostos','despesa'),
  ('FOLHA','Folha de Pagamento','despesa')
ON CONFLICT (codigo) DO NOTHING;
