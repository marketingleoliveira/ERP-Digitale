
ALTER TABLE public.op_expedicoes
  ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS volumes int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS peso_bruto numeric,
  ADD COLUMN IF NOT EXISTS peso_liquido numeric,
  ADD COLUMN IF NOT EXISTS frete_tipo text,
  ADD COLUMN IF NOT EXISTS separador_id uuid,
  ADD COLUMN IF NOT EXISTS conferente_id uuid,
  ADD COLUMN IF NOT EXISTS expedidor_id uuid,
  ADD COLUMN IF NOT EXISTS divergencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS romaneio_id uuid REFERENCES public.romaneios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comprovante_url text;

ALTER TABLE public.op_expedicoes DROP CONSTRAINT IF EXISTS op_expedicoes_status_check;
ALTER TABLE public.op_expedicoes
  ADD CONSTRAINT op_expedicoes_status_check CHECK (status = ANY (ARRAY[
    'aguardando','em_separacao','separado','em_conferencia','conferido',
    'expedido','em_transito','entregue','ocorrencia','devolvido',
    'preparando','saiu'
  ]));

ALTER TABLE public.op_expedicoes DROP CONSTRAINT IF EXISTS op_expedicoes_frete_tipo_check;
ALTER TABLE public.op_expedicoes
  ADD CONSTRAINT op_expedicoes_frete_tipo_check CHECK (
    frete_tipo IS NULL OR frete_tipo = ANY (ARRAY['CIF','FOB','Terceiros','Remetente','Destinatario','SemFrete'])
  );

ALTER TABLE public.op_expedicoes ALTER COLUMN op_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.expedicao_itens_lote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedicao_id uuid NOT NULL REFERENCES public.op_expedicoes(id) ON DELETE CASCADE,
  op_item_id uuid REFERENCES public.op_itens(id) ON DELETE SET NULL,
  pedido_item_id uuid REFERENCES public.pedido_itens(id) ON DELETE SET NULL,
  lote_id uuid REFERENCES public.lotes(id) ON DELETE SET NULL,
  product_id uuid,
  variante_id uuid,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_itens_lote TO authenticated;
GRANT ALL ON public.expedicao_itens_lote TO service_role;
ALTER TABLE public.expedicao_itens_lote ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth manage expedicao_itens_lote" ON public.expedicao_itens_lote;
CREATE POLICY "auth manage expedicao_itens_lote" ON public.expedicao_itens_lote
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_exp_itens_lote_expedicao ON public.expedicao_itens_lote(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_exp_itens_lote_lote ON public.expedicao_itens_lote(lote_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_op_expedicoes_updated_at') THEN
    CREATE TRIGGER trg_op_expedicoes_updated_at BEFORE UPDATE ON public.op_expedicoes
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.exp_registrar_evento(
  _expedicao_id uuid, _evento text, _descricao text DEFAULT NULL, _local text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _exp public.op_expedicoes%ROWTYPE; _event_id uuid;
BEGIN
  SELECT * INTO _exp FROM public.op_expedicoes WHERE id = _expedicao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expedição % não encontrada', _expedicao_id; END IF;

  INSERT INTO public.entrega_eventos(romaneio_id, nota_fiscal_id, data, evento, local, descricao, user_id)
  VALUES (_exp.romaneio_id, _exp.nota_fiscal_id, now(), _evento, _local, _descricao, auth.uid())
  RETURNING id INTO _event_id;

  IF _exp.op_id IS NOT NULL THEN
    INSERT INTO public.op_eventos(op_id, tipo, descricao, user_id, data)
    VALUES (_exp.op_id, 'expedicao_' || _evento, coalesce(_descricao, _evento), auth.uid(), now());
  END IF;
  RETURN _event_id;
END $$;

CREATE OR REPLACE FUNCTION public.exp_transicionar(
  _expedicao_id uuid, _novo_status text, _motivo text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _exp public.op_expedicoes%ROWTYPE; _nf_status text; _is_admin bool; _valido bool := false;
BEGIN
  SELECT * INTO _exp FROM public.op_expedicoes WHERE id = _expedicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expedição não encontrada'; END IF;

  _valido := CASE _exp.status
    WHEN 'aguardando' THEN _novo_status IN ('em_separacao','ocorrencia')
    WHEN 'em_separacao' THEN _novo_status IN ('separado','ocorrencia')
    WHEN 'separado' THEN _novo_status IN ('em_conferencia','ocorrencia')
    WHEN 'em_conferencia' THEN _novo_status IN ('conferido','ocorrencia','em_separacao')
    WHEN 'conferido' THEN _novo_status IN ('expedido','ocorrencia')
    WHEN 'expedido' THEN _novo_status IN ('em_transito','entregue','ocorrencia')
    WHEN 'em_transito' THEN _novo_status IN ('entregue','ocorrencia','devolvido')
    WHEN 'entregue' THEN _novo_status IN ('devolvido','ocorrencia')
    WHEN 'ocorrencia' THEN _novo_status IN ('em_separacao','em_transito','entregue','devolvido')
    ELSE false END;

  IF NOT _valido THEN
    RAISE EXCEPTION 'Transição inválida: % -> %', _exp.status, _novo_status;
  END IF;

  IF _novo_status = 'expedido' THEN
    SELECT status_sefaz INTO _nf_status FROM public.notas_fiscais WHERE id = _exp.nota_fiscal_id;
    IF _nf_status IS DISTINCT FROM 'autorizada' THEN
      _is_admin := public.has_role(auth.uid(), 'admin');
      IF NOT (_is_admin AND coalesce(_motivo,'') LIKE 'OVERRIDE_ADM:%') THEN
        RAISE EXCEPTION 'Não é possível expedir sem NF-e autorizada';
      END IF;
    END IF;
  END IF;

  UPDATE public.op_expedicoes SET status = _novo_status, updated_at = now()
   WHERE id = _expedicao_id;

  PERFORM public.exp_registrar_evento(_expedicao_id, _novo_status, _motivo, NULL);
END $$;

CREATE OR REPLACE FUNCTION public.exp_separar_lote(
  _expedicao_id uuid, _op_item_id uuid, _lote_id uuid, _quantidade numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _disp numeric; _id uuid; _exp public.op_expedicoes%ROWTYPE;
BEGIN
  SELECT * INTO _exp FROM public.op_expedicoes WHERE id = _expedicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expedição não encontrada'; END IF;

  SELECT quantidade_disponivel INTO _disp FROM public.lotes WHERE id = _lote_id FOR UPDATE;
  IF _disp IS NULL THEN RAISE EXCEPTION 'Lote % não encontrado', _lote_id; END IF;
  IF _disp < _quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente no lote (disponível: %, requisitado: %)', _disp, _quantidade;
  END IF;

  INSERT INTO public.expedicao_itens_lote(expedicao_id, op_item_id, lote_id, quantidade, user_id)
  VALUES (_expedicao_id, _op_item_id, _lote_id, _quantidade, auth.uid())
  RETURNING id INTO _id;

  UPDATE public.lotes SET quantidade_disponivel = quantidade_disponivel - _quantidade, updated_at = now()
   WHERE id = _lote_id;

  IF _exp.status = 'aguardando' THEN
    UPDATE public.op_expedicoes SET status = 'em_separacao', updated_at = now(),
           separador_id = coalesce(separador_id, auth.uid())
     WHERE id = _expedicao_id;
  END IF;
  RETURN _id;
END $$;
