-- Corrige integração entre romaneio e a máquina atual de estados da expedição.
--
-- Legado:
--   romaneio em_transito -> op_expedicoes.saiu
--
-- Atual:
--   expedido -> em_transito -> entregue
--
-- Mantemos o status legado "saiu" na constraint por compatibilidade com
-- registros históricos, mas novos fluxos de romaneio usam "em_transito".

CREATE OR REPLACE FUNCTION public.romaneio_transicionar(
  _romaneio_id uuid,
  _novo_status text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  atual text;
  novo_exp_status text;
  expedicoes_atualizadas integer := 0;
BEGIN
  SELECT status
    INTO atual
  FROM public.romaneios
  WHERE id = _romaneio_id
  FOR UPDATE;

  IF atual IS NULL THEN
    RAISE EXCEPTION 'Romaneio % não encontrado', _romaneio_id;
  END IF;

  IF atual = _novo_status THEN
    RETURN atual;
  END IF;

  UPDATE public.romaneios
     SET status = _novo_status,
         data_saida = CASE
           WHEN _novo_status = 'em_transito'
                AND data_saida IS NULL
             THEN now()
           ELSE data_saida
         END,
         data_entrega = CASE
           WHEN _novo_status = 'entregue'
             THEN now()
           ELSE data_entrega
         END,
         updated_at = now()
   WHERE id = _romaneio_id;

  novo_exp_status := CASE
    WHEN _novo_status = 'em_transito' THEN 'em_transito'
    WHEN _novo_status = 'entregue'    THEN 'entregue'
    WHEN _novo_status = 'devolvido'   THEN 'devolvido'
    ELSE NULL
  END;

  IF novo_exp_status IS NOT NULL THEN

    -- Fluxo atual: a expedição possui romaneio_id diretamente.
    UPDATE public.op_expedicoes
       SET status = novo_exp_status,
           data_saida = CASE
             WHEN novo_exp_status = 'em_transito'
                  AND data_saida IS NULL
               THEN now()
             ELSE data_saida
           END,
           data_entrega = CASE
             WHEN novo_exp_status = 'entregue'
               THEN now()
             ELSE data_entrega
           END,
           updated_at = now()
     WHERE romaneio_id = _romaneio_id;

    GET DIAGNOSTICS expedicoes_atualizadas = ROW_COUNT;

    -- Compatibilidade para registros antigos anteriores à associação
    -- direta op_expedicoes.romaneio_id.
    IF expedicoes_atualizadas = 0 THEN
      UPDATE public.op_expedicoes
         SET status = novo_exp_status,
             data_saida = CASE
               WHEN novo_exp_status = 'em_transito'
                    AND data_saida IS NULL
                 THEN now()
               ELSE data_saida
             END,
             data_entrega = CASE
               WHEN novo_exp_status = 'entregue'
                 THEN now()
               ELSE data_entrega
             END,
             updated_at = now()
       WHERE romaneio_id IS NULL
         AND op_id IN (
           SELECT ri.op_id
           FROM public.romaneio_itens ri
           WHERE ri.romaneio_id = _romaneio_id
             AND ri.op_id IS NOT NULL
         );
    END IF;

  END IF;

  INSERT INTO public.entrega_eventos (
    romaneio_id,
    evento,
    descricao,
    user_id
  )
  VALUES (
    _romaneio_id,
    _novo_status,
    'Transição ' || atual || ' → ' || _novo_status,
    auth.uid()
  );

  RETURN _novo_status;
END;
$function$;

-- SECURITY DEFINER: não permitir execução anônima.
REVOKE EXECUTE ON FUNCTION
  public.romaneio_transicionar(uuid, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.romaneio_transicionar(uuid, text)
TO authenticated, service_role;
