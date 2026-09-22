BEGIN;

CREATE OR REPLACE FUNCTION public.validar_recebimento_conferencia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_grupo RECORD;
  v_item RECORD;

  v_aprovada_total NUMERIC;
  v_saldo_pendente NUMERIC;
BEGIN

  /*
   * Esta função roda ANTES do trigger que efetiva:
   * - estoque;
   * - quantidade recebida;
   * - contas a pagar;
   * - status do pedido.
   *
   * Portanto qualquer erro aqui impede efeitos parciais.
   */
  IF NEW.status = 'conferido'
     AND COALESCE(OLD.status, '') <> 'conferido' THEN

    ------------------------------------------------------------
    -- VALIDAR O TOTAL APROVADO POR ITEM DO PEDIDO
    --
    -- Agrupar é importante porque um mesmo pedido_item_id
    -- poderia aparecer mais de uma vez no mesmo recebimento.
    ------------------------------------------------------------

    FOR v_grupo IN

      SELECT
        ri.pedido_item_id,
        COALESCE(
          SUM(ri.quantidade_aprovada),
          0
        ) AS aprovada_total

      FROM public.recebimento_itens ri

      WHERE ri.recebimento_id = NEW.id

      GROUP BY ri.pedido_item_id

      ORDER BY ri.pedido_item_id

    LOOP

      ----------------------------------------------------------
      -- BLOQUEAR A LINHA DO ITEM
      --
      -- Evita que duas conferências simultâneas leiam
      -- o mesmo saldo pendente e ambas sejam aprovadas.
      ----------------------------------------------------------

      SELECT *
      INTO v_item
      FROM public.pedidos_compra_itens
      WHERE id = v_grupo.pedido_item_id
      FOR UPDATE;


      IF NOT FOUND THEN

        RAISE EXCEPTION USING
          ERRCODE = '23503',
          MESSAGE = format(
            'Item de pedido %s não encontrado para o recebimento %s.',
            v_grupo.pedido_item_id,
            NEW.id
          );

      END IF;


      ----------------------------------------------------------
      -- O ITEM PRECISA PERTENCER AO MESMO PEDIDO
      ----------------------------------------------------------

      IF v_item.pedido_id IS DISTINCT FROM NEW.pedido_id THEN

        RAISE EXCEPTION USING
          ERRCODE = '23514',
          MESSAGE = format(
            'Item %s pertence ao pedido %s, mas o recebimento %s pertence ao pedido %s.',
            v_item.id,
            v_item.pedido_id,
            NEW.id,
            NEW.pedido_id
          );

      END IF;


      v_aprovada_total :=
        COALESCE(
          v_grupo.aprovada_total,
          0
        );


      v_saldo_pendente :=
        v_item.quantidade
        - COALESCE(
            v_item.quantidade_recebida,
            0
          );


      ----------------------------------------------------------
      -- BLOQUEAR OVER-RECEIPT
      ----------------------------------------------------------

      IF v_aprovada_total > v_saldo_pendente THEN

        RAISE EXCEPTION USING
          ERRCODE = '23514',
          MESSAGE = format(
            'Recebimento excede o saldo pendente do item %s: pedido=%s, já recebido=%s, saldo=%s, tentativa aprovada=%s.',
            v_item.id,
            v_item.quantidade,
            COALESCE(v_item.quantidade_recebida, 0),
            v_saldo_pendente,
            v_aprovada_total
          );

      END IF;

    END LOOP;

  END IF;


  RETURN NEW;

END;
$function$;


REVOKE ALL
ON FUNCTION public.validar_recebimento_conferencia()
FROM PUBLIC;


DROP TRIGGER IF EXISTS
  trg_00_recebimento_validar_conferencia
ON public.recebimentos;


CREATE TRIGGER trg_00_recebimento_validar_conferencia
BEFORE UPDATE
ON public.recebimentos
FOR EACH ROW
EXECUTE FUNCTION public.validar_recebimento_conferencia();


COMMIT;
