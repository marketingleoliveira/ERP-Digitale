BEGIN;

CREATE OR REPLACE FUNCTION public.on_recebimento_conferido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ri RECORD;
  pi RECORD;
  ped RECORD;

  novo_lote_id UUID;

  qtd_pendente NUMERIC;

  n_parcelas INTEGER;
  valor_parcela NUMERIC;
  i INTEGER;

  v_lote_tipo TEXT;
BEGIN

  IF NEW.status = 'conferido'
     AND COALESCE(OLD.status, '') <> 'conferido' THEN

    ------------------------------------------------------------
    -- ESTOQUE / QUANTIDADE RECEBIDA
    ------------------------------------------------------------

    FOR ri IN
      SELECT *
      FROM public.recebimento_itens
      WHERE recebimento_id = NEW.id
    LOOP

      SELECT *
      INTO pi
      FROM public.pedidos_compra_itens
      WHERE id = ri.pedido_item_id;


      /*
       * Modelo canônico de lotes do ERP:
       *
       * fio      -> fio
       * produto  -> produto_acabado
       * variante -> produto_acabado
       *
       * O item_id continua sendo a referência original:
       * produto_id ou variante_id.
       */
      v_lote_tipo :=
        CASE pi.tipo_ref
          WHEN 'fio'
            THEN 'fio'

          WHEN 'produto'
            THEN 'produto_acabado'

          WHEN 'variante'
            THEN 'produto_acabado'

          ELSE NULL
        END;


      IF ri.quantidade_aprovada > 0
         AND pi.ref_id IS NOT NULL
         AND v_lote_tipo IS NOT NULL THEN

        INSERT INTO public.lotes (
          tipo,
          item_id,
          numero_lote,
          quantidade,
          quantidade_disponivel,
          data_entrada,
          fornecedor_id,
          habilitado,
          observacao
        )
        VALUES (
          v_lote_tipo,
          pi.ref_id,

          COALESCE(
            ri.lote_fornecedor,
            'REC-'
              || NEW.numero
              || '-'
              || substr(ri.id::text, 1, 6)
          ),

          ri.quantidade_aprovada,
          ri.quantidade_aprovada,
          NEW.data_recebimento,

          (
            SELECT fornecedor_id
            FROM public.pedidos_compra
            WHERE id = pi.pedido_id
          ),

          true,
          'Recebimento #' || NEW.numero
        )
        RETURNING id
        INTO novo_lote_id;


        UPDATE public.recebimento_itens
        SET lote_id = novo_lote_id
        WHERE id = ri.id;

      END IF;


      UPDATE public.pedidos_compra_itens
      SET quantidade_recebida =
        COALESCE(quantidade_recebida, 0)
        + ri.quantidade_aprovada
      WHERE id = ri.pedido_item_id;

    END LOOP;


    ------------------------------------------------------------
    -- STATUS DO PEDIDO
    ------------------------------------------------------------

    SELECT *
    INTO ped
    FROM public.pedidos_compra
    WHERE id = NEW.pedido_id;


    SELECT
      SUM(
        quantidade
        - COALESCE(quantidade_recebida, 0)
      )
    INTO qtd_pendente
    FROM public.pedidos_compra_itens
    WHERE pedido_id = ped.id;


    IF qtd_pendente <= 0 THEN

      UPDATE public.pedidos_compra
      SET status = 'recebido'
      WHERE id = ped.id;

    ELSE

      UPDATE public.pedidos_compra
      SET status = 'parcial'
      WHERE id = ped.id;

    END IF;


    ------------------------------------------------------------
    -- CONTAS A PAGAR
    ------------------------------------------------------------

    IF NOT EXISTS (
      SELECT 1
      FROM public.contas_pagar
      WHERE recebimento_id = NEW.id
    ) THEN

      n_parcelas :=
        GREATEST(
          1,
          COALESCE(
            (
              regexp_match(
                COALESCE(ped.condicao_pagamento, ''),
                '(\d+)x'
              )
            )[1]::int,
            1
          )
        );


      valor_parcela :=
        ROUND(
          COALESCE(
            NEW.valor_nota,
            ped.valor_total,
            0
          ) / n_parcelas,
          2
        );


      FOR i IN 1..n_parcelas LOOP

        INSERT INTO public.contas_pagar (
          pedido_id,
          recebimento_id,
          fornecedor_id,
          descricao,
          parcela,
          total_parcelas,
          valor,
          vencimento
        )
        VALUES (
          ped.id,
          NEW.id,
          ped.fornecedor_id,

          'PC '
            || ped.numero
            || ' / Rec '
            || NEW.numero,

          i,
          n_parcelas,
          valor_parcela,

          NEW.data_recebimento
            + (i * 30)
        );

      END LOOP;

    END IF;


    ------------------------------------------------------------
    -- AUDITORIA
    ------------------------------------------------------------

    INSERT INTO public.compras_eventos (
      entidade,
      entidade_id,
      acao,
      de_status,
      para_status,
      user_id,
      payload
    )
    VALUES (
      'recebimento',
      NEW.id,
      'conferido',
      OLD.status,
      NEW.status,
      auth.uid(),

      jsonb_build_object(
        'pedido_id',
        NEW.pedido_id
      )
    );


    NEW.conferido_em := now();

  END IF;


  RETURN NEW;

END;
$function$;

COMMIT;
