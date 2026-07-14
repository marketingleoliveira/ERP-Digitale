
CREATE OR REPLACE FUNCTION public.on_nfe_autorizada_op()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  atual public.op_status;
BEGIN
  IF NEW.status_sefaz = 'autorizada'
     AND COALESCE(OLD.status_sefaz,'') <> 'autorizada'
     AND NEW.op_id IS NOT NULL THEN

    SELECT status INTO atual FROM public.ordens_producao WHERE id = NEW.op_id FOR UPDATE;

    IF atual = 'pronta_faturamento' THEN
      PERFORM public.op_transicionar(NEW.op_id, 'faturada'::public.op_status, NULL);
    END IF;

    UPDATE public.op_faturamento
       SET status = 'faturado', nota_fiscal_id = NEW.id, updated_at = now()
     WHERE op_id = NEW.op_id AND status IN ('pendente','pre_faturado');

    INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
    VALUES (NEW.op_id, 'nfe_autorizada',
            jsonb_build_object('nota_fiscal_id', NEW.id, 'chave', NEW.chave_acesso),
            auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_nfe_autorizada_op ON public.notas_fiscais;
CREATE TRIGGER trg_on_nfe_autorizada_op
AFTER UPDATE OF status_sefaz ON public.notas_fiscais
FOR EACH ROW EXECUTE FUNCTION public.on_nfe_autorizada_op();
