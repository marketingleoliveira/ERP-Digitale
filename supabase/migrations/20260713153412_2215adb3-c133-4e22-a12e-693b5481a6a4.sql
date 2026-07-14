ALTER TABLE public.op_qualidade
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando','em_inspecao','aprovada','aprovada_parcial','reprovada','reprocesso')),
  ADD COLUMN IF NOT EXISTS quantidade_reprocesso NUMERIC(14,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defeito TEXT,
  ADD COLUMN IF NOT EXISTS causa TEXT,
  ADD COLUMN IF NOT EXISTS observacao TEXT,
  ADD COLUMN IF NOT EXISTS evidencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_op_qualidade_updated_at ON public.op_qualidade;
CREATE TRIGGER trg_op_qualidade_updated_at BEFORE UPDATE ON public.op_qualidade
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.op_registrar_inspecao(
  _op_id UUID,
  _qtd_aprovada NUMERIC,
  _qtd_reprovada NUMERIC,
  _qtd_reprocesso NUMERIC,
  _defeito TEXT DEFAULT NULL,
  _causa TEXT DEFAULT NULL,
  _observacao TEXT DEFAULT NULL,
  _evidencias JSONB DEFAULT '[]'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inspecao_id UUID;
  v_status TEXT;
  v_produto UUID;
  v_variante UUID;
  v_lote_id UUID;
  v_numero_op INTEGER;
  v_op_status op_status;
BEGIN
  SELECT status, numero INTO v_op_status, v_numero_op FROM public.ordens_producao WHERE id = _op_id FOR UPDATE;
  IF v_op_status IS NULL THEN RAISE EXCEPTION 'OP % não encontrada', _op_id; END IF;

  _qtd_aprovada := COALESCE(_qtd_aprovada,0);
  _qtd_reprovada := COALESCE(_qtd_reprovada,0);
  _qtd_reprocesso := COALESCE(_qtd_reprocesso,0);

  IF _qtd_aprovada + _qtd_reprovada + _qtd_reprocesso <= 0 THEN
    RAISE EXCEPTION 'Informe ao menos uma quantidade (aprovada, reprovada ou reprocesso)';
  END IF;

  v_status := CASE
    WHEN _qtd_reprocesso > 0 AND _qtd_aprovada = 0 AND _qtd_reprovada = 0 THEN 'reprocesso'
    WHEN _qtd_aprovada > 0 AND _qtd_reprovada = 0 AND _qtd_reprocesso = 0 THEN 'aprovada'
    WHEN _qtd_reprovada > 0 AND _qtd_aprovada = 0 AND _qtd_reprocesso = 0 THEN 'reprovada'
    ELSE 'aprovada_parcial'
  END;

  INSERT INTO public.op_qualidade(
    op_id, inspetor_id, resultado, status,
    quantidade_aprovada, quantidade_reprovada, quantidade_reprocesso,
    defeito, causa, motivo, observacao, evidencias, data
  ) VALUES (
    _op_id, auth.uid(), v_status, v_status,
    _qtd_aprovada, _qtd_reprovada, _qtd_reprocesso,
    _defeito, _causa, _defeito, _observacao, COALESCE(_evidencias,'[]'::jsonb), now()
  ) RETURNING id INTO v_inspecao_id;

  IF _qtd_aprovada > 0 THEN
    SELECT product_id, variante_id INTO v_produto, v_variante
      FROM public.op_itens WHERE op_id = _op_id ORDER BY created_at ASC LIMIT 1;

    IF v_produto IS NOT NULL THEN
      INSERT INTO public.lotes(tipo, item_id, numero_lote, quantidade, quantidade_disponivel, data_entrada, op_id, observacao)
      VALUES ('produto_acabado', v_produto,
              'Q-' || COALESCE(v_numero_op::text,'OP') || '-' || substr(v_inspecao_id::text,1,6),
              _qtd_aprovada, _qtd_aprovada, CURRENT_DATE, _op_id,
              'Lote gerado por inspeção ' || v_inspecao_id::text)
      RETURNING id INTO v_lote_id;

      INSERT INTO public.op_entradas_estoque(op_id, product_id, variante_id, lote_id, quantidade, data_entrada, user_id)
      VALUES (_op_id, v_produto, v_variante, v_lote_id, _qtd_aprovada, now(), auth.uid());
    END IF;
  END IF;

  IF _qtd_reprovada > 0 THEN
    INSERT INTO public.op_apontamentos(op_id, funcionario_id, inicio, fim, quantidade_produzida, quantidade_refugo, motivo_refugo, observacao)
    VALUES (_op_id, auth.uid(), now(), now(), 0, _qtd_reprovada, _defeito, 'Refugo por inspeção ' || v_inspecao_id::text);
  END IF;

  IF _qtd_reprocesso > 0 THEN
    PERFORM public.op_criar_reprocesso(_op_id, COALESCE(_defeito,'Reprocesso de inspeção'), _qtd_reprocesso);
  END IF;

  IF v_status = 'aprovada' AND v_op_status = 'aguardando_qualidade' THEN
    PERFORM public.op_transicionar(_op_id, 'aprovada'::op_status,
      jsonb_build_object('inspecao_id', v_inspecao_id, 'qtd_aprovada', _qtd_aprovada));
  ELSIF v_status = 'reprovada' AND v_op_status = 'aguardando_qualidade' THEN
    PERFORM public.op_transicionar(_op_id, 'reprovada'::op_status,
      jsonb_build_object('inspecao_id', v_inspecao_id, 'qtd_reprovada', _qtd_reprovada));
  END IF;

  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (_op_id, 'inspecao_registrada',
          jsonb_build_object('inspecao_id', v_inspecao_id, 'status', v_status,
                             'aprovada', _qtd_aprovada, 'reprovada', _qtd_reprovada, 'reprocesso', _qtd_reprocesso),
          auth.uid());

  RETURN v_inspecao_id;
END; $$;

CREATE OR REPLACE VIEW public.v_qualidade_indicadores AS
SELECT
  q.id,
  q.op_id,
  q.data,
  q.status,
  q.quantidade_aprovada,
  q.quantidade_reprovada,
  q.quantidade_reprocesso,
  q.defeito,
  q.causa,
  op.maquina_id,
  op.numero AS op_numero,
  oi.product_id,
  p.article_id
FROM public.op_qualidade q
JOIN public.ordens_producao op ON op.id = q.op_id
LEFT JOIN LATERAL (SELECT product_id FROM public.op_itens WHERE op_id = q.op_id ORDER BY created_at LIMIT 1) oi ON true
LEFT JOIN public.products p ON p.id = oi.product_id;

GRANT SELECT ON public.v_qualidade_indicadores TO authenticated;