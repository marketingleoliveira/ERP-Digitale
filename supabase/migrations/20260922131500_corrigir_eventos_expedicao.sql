-- Corrige incompatibilidade entre exp_registrar_evento e op_eventos.
-- A tabela atual utiliza payload/created_at, não descricao/data.

CREATE OR REPLACE FUNCTION public.exp_registrar_evento(
  _expedicao_id uuid,
  _evento text,
  _descricao text DEFAULT NULL,
  _local text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _exp public.op_expedicoes%ROWTYPE;
  _event_id uuid;
BEGIN
  SELECT *
  INTO _exp
  FROM public.op_expedicoes
  WHERE id = _expedicao_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expedição % não encontrada', _expedicao_id;
  END IF;

  INSERT INTO public.entrega_eventos (
    romaneio_id,
    nota_fiscal_id,
    data,
    evento,
    local,
    descricao,
    user_id
  )
  VALUES (
    _exp.romaneio_id,
    _exp.nota_fiscal_id,
    now(),
    _evento,
    _local,
    _descricao,
    auth.uid()
  )
  RETURNING id INTO _event_id;

  IF _exp.op_id IS NOT NULL THEN
    INSERT INTO public.op_eventos (
      op_id,
      tipo,
      payload,
      user_id
    )
    VALUES (
      _exp.op_id,
      'expedicao_' || _evento,
      jsonb_build_object(
        'expedicao_id', _expedicao_id,
        'evento', _evento,
        'descricao', COALESCE(_descricao, _evento),
        'local', _local
      ),
      auth.uid()
    );
  END IF;

  RETURN _event_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION
  public.exp_registrar_evento(uuid, text, text, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.exp_registrar_evento(uuid, text, text, text)
TO authenticated, service_role;
