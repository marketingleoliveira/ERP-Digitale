BEGIN;

ALTER TABLE public.lotes
  DROP CONSTRAINT IF EXISTS lotes_tipo_check;

ALTER TABLE public.lotes
  ADD CONSTRAINT lotes_tipo_check
  CHECK (tipo = ANY (ARRAY[
    'tecido'::text,
    'fio'::text,
    'produto_acabado'::text
  ]));

CREATE OR REPLACE FUNCTION public.op_registrar_inspecao(
  _op_id uuid,
  _qtd_aprovada numeric,
  _qtd_reprovada numeric,
  _qtd_reprocesso numeric,
  _defeito text DEFAULT NULL,
  _causa text DEFAULT NULL,
  _observacao text DEFAULT NULL,
  _evidencias jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_inspecao_id uuid;
  v_resultado text;
  v_status text;
  v_op_item_id uuid;
  v_produto uuid;
  v_variante uuid;
  v_item_estoque uuid;
  v_lote_id uuid;
  v_numero_op integer;
  v_op_status public.op_status;
  v_produzida numeric;
  v_total_inspecionado numeric;
BEGIN
  SELECT status, numero
  INTO v_op_status, v_numero_op
  FROM public.ordens_producao
  WHERE id = _op_id
  FOR UPDATE;

  IF v_op_status IS NULL THEN
    RAISE EXCEPTION 'OP % não encontrada', _op_id;
  END IF;

  IF v_op_status <> 'aguardando_qualidade'::public.op_status THEN
    RAISE EXCEPTION
      'OP % deve estar aguardando qualidade. Status atual: %',
      _op_id,
      v_op_status;
  END IF;

  _qtd_aprovada := COALESCE(_qtd_aprovada, 0);
  _qtd_reprovada := COALESCE(_qtd_reprovada, 0);
  _qtd_reprocesso := COALESCE(_qtd_reprocesso, 0);

  IF _qtd_aprovada < 0
     OR _qtd_reprovada < 0
     OR _qtd_reprocesso < 0 THEN
    RAISE EXCEPTION 'As quantidades da inspeção não podem ser negativas';
  END IF;

  IF _qtd_aprovada + _qtd_reprovada + _qtd_reprocesso <= 0 THEN
    RAISE EXCEPTION
      'Informe ao menos uma quantidade aprovada, reprovada ou de reprocesso';
  END IF;

  SELECT COALESCE(SUM(quantidade_produzida), 0)
  INTO v_produzida
  FROM public.op_itens
  WHERE op_id = _op_id;

  SELECT id, product_id, variante_id
  INTO v_op_item_id, v_produto, v_variante
  FROM public.op_itens
  WHERE op_id = _op_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1;

  IF v_produto IS NULL THEN
    RAISE EXCEPTION 'A OP % não possui item de produção', _op_id;
  END IF;

  SELECT COALESCE(
    SUM(
      quantidade_aprovada
      + quantidade_reprovada
      + quantidade_reprocesso
    ),
    0
  )
  INTO v_total_inspecionado
  FROM public.op_qualidade
  WHERE op_id = _op_id;

  IF v_total_inspecionado
     + _qtd_aprovada
     + _qtd_reprovada
     + _qtd_reprocesso
     > v_produzida THEN
    RAISE EXCEPTION
      'Quantidade inspecionada excede a produzida. Produzida: %, já inspecionada: %, nova inspeção: %',
      v_produzida,
      v_total_inspecionado,
      _qtd_aprovada + _qtd_reprovada + _qtd_reprocesso;
  END IF;

  v_resultado := CASE
    WHEN _qtd_aprovada > 0
         AND _qtd_reprovada = 0
         AND _qtd_reprocesso = 0
      THEN 'aprovado'
    WHEN _qtd_reprovada > 0
         AND _qtd_aprovada = 0
         AND _qtd_reprocesso = 0
      THEN 'reprovado'
    ELSE 'parcial'
  END;

  v_status := CASE
    WHEN _qtd_reprocesso > 0
         AND _qtd_aprovada = 0
         AND _qtd_reprovada = 0
      THEN 'reprocesso'
    WHEN _qtd_aprovada > 0
         AND _qtd_reprovada = 0
         AND _qtd_reprocesso = 0
      THEN 'aprovada'
    WHEN _qtd_reprovada > 0
         AND _qtd_aprovada = 0
         AND _qtd_reprocesso = 0
      THEN 'reprovada'
    ELSE 'aprovada_parcial'
  END;

  INSERT INTO public.op_qualidade (
    op_id,
    inspetor_id,
    resultado,
    status,
    quantidade_aprovada,
    quantidade_reprovada,
    quantidade_reprocesso,
    defeito,
    causa,
    motivo,
    observacao,
    evidencias,
    data
  )
  VALUES (
    _op_id,
    auth.uid(),
    v_resultado,
    v_status,
    _qtd_aprovada,
    _qtd_reprovada,
    _qtd_reprocesso,
    _defeito,
    _causa,
    _defeito,
    _observacao,
    COALESCE(_evidencias, '[]'::jsonb),
    now()
  )
  RETURNING id INTO v_inspecao_id;

  UPDATE public.op_itens
  SET
    quantidade_aprovada =
      COALESCE(quantidade_aprovada, 0) + _qtd_aprovada,
    quantidade_reprovada =
      COALESCE(quantidade_reprovada, 0) + _qtd_reprovada
  WHERE id = v_op_item_id;

  IF _qtd_aprovada > 0 THEN
    v_item_estoque := COALESCE(v_variante, v_produto);

    INSERT INTO public.lotes (
      tipo,
      item_id,
      numero_lote,
      quantidade,
      quantidade_disponivel,
      data_entrada,
      op_id,
      observacao
    )
    VALUES (
      'produto_acabado',
      v_item_estoque,
      'Q-' || COALESCE(v_numero_op::text, 'OP')
        || '-' || substr(v_inspecao_id::text, 1, 6),
      _qtd_aprovada,
      _qtd_aprovada,
      CURRENT_DATE,
      _op_id,
      'Lote gerado pela inspeção de qualidade '
        || v_inspecao_id::text
    )
    RETURNING id INTO v_lote_id;

    INSERT INTO public.op_entradas_estoque (
      op_id,
      product_id,
      variante_id,
      lote_id,
      quantidade,
      data_entrada,
      user_id
    )
    VALUES (
      _op_id,
      v_produto,
      v_variante,
      v_lote_id,
      _qtd_aprovada,
      now(),
      auth.uid()
    );
  END IF;

  IF _qtd_reprovada > 0 THEN
    INSERT INTO public.op_apontamentos (
      op_id,
      funcionario_id,
      inicio,
      fim,
      quantidade_produzida,
      quantidade_refugo,
      motivo_refugo,
      observacao
    )
    VALUES (
      _op_id,
      auth.uid(),
      now(),
      now(),
      0,
      _qtd_reprovada,
      CASE
        WHEN lower(COALESCE(_defeito, '')) IN (
          'furo',
          'mancha',
          'medida',
          'tensao',
          'tonalidade'
        )
          THEN lower(_defeito)
        ELSE 'outro'
      END,
      'Refugo registrado pela inspeção '
        || v_inspecao_id::text
        || CASE
             WHEN _defeito IS NOT NULL
               THEN ' - Defeito: ' || _defeito
             ELSE ''
           END
    );
  END IF;

  IF _qtd_reprocesso > 0 THEN
    PERFORM public.op_criar_reprocesso(
      _op_id,
      COALESCE(_defeito, 'Reprocesso de inspeção'),
      _qtd_reprocesso
    );
  END IF;

  IF v_status = 'aprovada' THEN
    PERFORM public.op_transicionar(
      _op_id,
      'aprovada'::public.op_status,
      jsonb_build_object(
        'inspecao_id', v_inspecao_id,
        'qtd_aprovada', _qtd_aprovada
      )
    );
  ELSIF v_status = 'reprovada' THEN
    PERFORM public.op_transicionar(
      _op_id,
      'reprovada'::public.op_status,
      jsonb_build_object(
        'inspecao_id', v_inspecao_id,
        'qtd_reprovada', _qtd_reprovada
      )
    );
  END IF;

  INSERT INTO public.op_eventos (
    op_id,
    tipo,
    payload,
    user_id
  )
  VALUES (
    _op_id,
    'inspecao_registrada',
    jsonb_build_object(
      'inspecao_id', v_inspecao_id,
      'status', v_status,
      'resultado', v_resultado,
      'aprovada', _qtd_aprovada,
      'reprovada', _qtd_reprovada,
      'reprocesso', _qtd_reprocesso,
      'lote_id', v_lote_id
    ),
    auth.uid()
  );

  RETURN v_inspecao_id;
END;
$function$;


-- SECURITY DEFINER: não permitir execução anônima.
REVOKE EXECUTE ON FUNCTION
  public.op_registrar_inspecao(uuid, numeric, numeric, numeric, text, text, text, jsonb)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.op_registrar_inspecao(uuid, numeric, numeric, numeric, text, text, text, jsonb)
TO authenticated, service_role;

COMMIT;
