BEGIN;

CREATE OR REPLACE FUNCTION public.ajustar_centavos_parcelas_recebimento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total NUMERIC;
BEGIN
  IF NEW.status = 'conferido'
     AND COALESCE(OLD.status, '') <> 'conferido' THEN

    SELECT COALESCE(NEW.valor_nota, pc.valor_total, 0)
    INTO v_total
    FROM public.pedidos_compra pc
    WHERE pc.id = NEW.pedido_id;

    UPDATE public.contas_pagar cp
    SET valor = ROUND(
      v_total - COALESCE(
        (
          SELECT SUM(anterior.valor)
          FROM public.contas_pagar anterior
          WHERE anterior.recebimento_id = NEW.id
            AND anterior.parcela < cp.parcela
        ),
        0
      ),
      2
    )
    WHERE cp.recebimento_id = NEW.id
      AND cp.parcela = cp.total_parcelas;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL
ON FUNCTION public.ajustar_centavos_parcelas_recebimento()
FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_z_recebimento_ajustar_parcelas
ON public.recebimentos;

CREATE TRIGGER trg_z_recebimento_ajustar_parcelas
AFTER UPDATE
ON public.recebimentos
FOR EACH ROW
EXECUTE FUNCTION public.ajustar_centavos_parcelas_recebimento();

COMMIT;