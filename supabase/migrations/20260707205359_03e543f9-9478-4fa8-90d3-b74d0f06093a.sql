
CREATE TABLE public.estoque_movimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra','producao','venda','ajuste','inventario','transferencia','cancelamento','entrada_manual','saida_manual')),
  operacao TEXT NOT NULL CHECK (operacao IN ('entrada','saida')),
  lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
  item_tipo TEXT,
  item_id UUID,
  quantidade NUMERIC(14,3) NOT NULL,
  saldo_anterior NUMERIC(14,3) NOT NULL,
  saldo_posterior NUMERIC(14,3) NOT NULL,
  op_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  recebimento_id UUID REFERENCES public.recebimentos(id) ON DELETE SET NULL,
  documento_origem TEXT,
  observacao TEXT,
  user_id UUID REFERENCES auth.users(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.estoque_movimentos(lote_id);
CREATE INDEX ON public.estoque_movimentos(item_tipo, item_id);
CREATE INDEX ON public.estoque_movimentos(tipo);
CREATE INDEX ON public.estoque_movimentos(created_at DESC);

GRANT SELECT, INSERT ON public.estoque_movimentos TO authenticated;
GRANT ALL ON public.estoque_movimentos TO service_role;
ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kardex_read" ON public.estoque_movimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "kardex_insert" ON public.estoque_movimentos FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: toda mudança em lote.quantidade_disponivel gera movimento no kardex
CREATE OR REPLACE FUNCTION public.on_lote_movimento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_ant NUMERIC(14,3);
  v_saldo_pos NUMERIC(14,3);
  v_delta NUMERIC(14,3);
  v_tipo TEXT;
  v_op UUID;
  v_nf UUID;
  v_rec UUID;
  v_doc TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_saldo_ant := 0;
    v_saldo_pos := COALESCE(NEW.quantidade_disponivel, 0);
    v_delta := v_saldo_pos - v_saldo_ant;
    v_tipo := COALESCE(NULLIF(current_setting('compras.tipo_movimento', true), ''), 'compra');
  ELSIF TG_OP = 'UPDATE' THEN
    v_saldo_ant := COALESCE(OLD.quantidade_disponivel, 0);
    v_saldo_pos := COALESCE(NEW.quantidade_disponivel, 0);
    v_delta := v_saldo_pos - v_saldo_ant;
    IF v_delta = 0 THEN RETURN NEW; END IF;
    v_tipo := COALESCE(NULLIF(current_setting('compras.tipo_movimento', true), ''),
                       CASE WHEN v_delta > 0 THEN 'ajuste' ELSE 'producao' END);
  ELSIF TG_OP = 'DELETE' THEN
    v_saldo_ant := COALESCE(OLD.quantidade_disponivel, 0);
    v_saldo_pos := 0;
    v_delta := -v_saldo_ant;
    v_tipo := 'cancelamento';
  END IF;

  BEGIN v_op := NULLIF(current_setting('compras.op_id', true), '')::uuid; EXCEPTION WHEN OTHERS THEN v_op := NULL; END;
  BEGIN v_nf := NULLIF(current_setting('compras.nf_id', true), '')::uuid; EXCEPTION WHEN OTHERS THEN v_nf := NULL; END;
  BEGIN v_rec := NULLIF(current_setting('compras.recebimento_id', true), '')::uuid; EXCEPTION WHEN OTHERS THEN v_rec := NULL; END;
  v_doc := NULLIF(current_setting('compras.documento_origem', true), '');

  INSERT INTO public.estoque_movimentos(
    tipo, operacao, lote_id, item_tipo, item_id,
    quantidade, saldo_anterior, saldo_posterior,
    op_id, nota_fiscal_id, recebimento_id, documento_origem, user_id
  ) VALUES (
    v_tipo,
    CASE WHEN v_delta >= 0 THEN 'entrada' ELSE 'saida' END,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.tipo, OLD.tipo),
    COALESCE(NEW.item_id, OLD.item_id),
    ABS(v_delta), v_saldo_ant, v_saldo_pos,
    COALESCE(v_op, NEW.op_id, OLD.op_id),
    v_nf, v_rec, v_doc, auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_lote_kardex
  AFTER INSERT OR UPDATE OF quantidade_disponivel OR DELETE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.on_lote_movimento();

-- Helper: registrar movimento manual (que atualiza o lote e dispara o trigger)
CREATE OR REPLACE FUNCTION public.kardex_movimentar(
  _lote_id UUID,
  _tipo TEXT,
  _quantidade NUMERIC,
  _operacao TEXT DEFAULT 'saida',
  _observacao TEXT DEFAULT NULL,
  _documento_origem TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote RECORD;
  v_novo NUMERIC;
BEGIN
  SELECT * INTO v_lote FROM public.lotes WHERE id = _lote_id FOR UPDATE;
  IF v_lote IS NULL THEN RAISE EXCEPTION 'Lote % não encontrado', _lote_id; END IF;

  v_novo := v_lote.quantidade_disponivel + CASE WHEN _operacao = 'entrada' THEN _quantidade ELSE -_quantidade END;
  IF v_novo < 0 THEN RAISE EXCEPTION 'Saldo insuficiente (atual %, tentado %)', v_lote.quantidade_disponivel, _quantidade; END IF;

  PERFORM set_config('compras.tipo_movimento', _tipo, true);
  IF _documento_origem IS NOT NULL THEN
    PERFORM set_config('compras.documento_origem', _documento_origem, true);
  END IF;

  UPDATE public.lotes SET quantidade_disponivel = v_novo, updated_at = now() WHERE id = _lote_id;

  UPDATE public.estoque_movimentos SET observacao = _observacao
    WHERE id = (SELECT id FROM public.estoque_movimentos WHERE lote_id = _lote_id ORDER BY created_at DESC LIMIT 1);

  RETURN _lote_id;
END;
$$;
