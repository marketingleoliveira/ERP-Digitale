BEGIN;

CREATE OR REPLACE FUNCTION public.liquidar_conta_receber(
  _conta_id uuid,
  _valor_pago numeric,
  _data date DEFAULT CURRENT_DATE,
  _conta_bancaria_id uuid DEFAULT NULL,
  _forma_pagamento text DEFAULT NULL,
  _juros numeric DEFAULT 0,
  _desconto numeric DEFAULT 0,
  _observacao text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.contas_receber%ROWTYPE;

  v_mov_id uuid;

  v_juros numeric :=
    COALESCE(_juros, 0);

  v_desconto numeric :=
    COALESCE(_desconto, 0);

  v_principal_baixado numeric;
  v_saldo_principal numeric;
  v_novo_pago numeric;
  v_novo_status text;
BEGIN

  SELECT *
  INTO c
  FROM public.contas_receber
  WHERE id = _conta_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Conta a receber % não encontrada',
      _conta_id;
  END IF;


  IF c.status = 'pago' THEN
    RAISE EXCEPTION
      'Conta já liquidada';
  END IF;


  IF c.status = 'cancelado' THEN
    RAISE EXCEPTION
      'Conta cancelada não pode receber baixa';
  END IF;


  IF _valor_pago IS NULL
     OR _valor_pago <= 0 THEN

    RAISE EXCEPTION
      'Valor recebido deve ser maior que zero';

  END IF;


  IF v_juros < 0 THEN
    RAISE EXCEPTION
      'Juros não podem ser negativos';
  END IF;


  IF v_desconto < 0 THEN
    RAISE EXCEPTION
      'Desconto não pode ser negativo';
  END IF;


  /*
   * _valor_pago representa o dinheiro efetivamente recebido.
   *
   * valor_pago em contas_receber representa o principal já
   * liquidado, utilizado pelos saldos e dashboards do ERP.
   *
   * Exemplo:
   * título 1000
   * caixa 1050
   * juros 50
   * principal baixado = 1000
   */
  v_principal_baixado :=
    _valor_pago - v_juros + v_desconto;


  IF v_principal_baixado <= 0 THEN

    RAISE EXCEPTION
      'Valor líquido aplicado ao principal deve ser maior que zero';

  END IF;


  v_saldo_principal :=
    c.valor - COALESCE(c.valor_pago, 0);


  IF v_saldo_principal <= 0 THEN

    RAISE EXCEPTION
      'Conta não possui saldo principal pendente';

  END IF;


  IF v_principal_baixado > v_saldo_principal THEN

    RAISE EXCEPTION
      'Baixa excede saldo principal: baixa %, saldo %',
      v_principal_baixado,
      v_saldo_principal;

  END IF;


  v_novo_pago :=
    COALESCE(c.valor_pago, 0)
    + v_principal_baixado;


  v_novo_status :=
    CASE
      WHEN v_novo_pago = c.valor
        THEN 'pago'
      ELSE 'parcial'
    END;


  UPDATE public.contas_receber
  SET
    status = v_novo_status,
    valor_pago = v_novo_pago,

    pago_em =
      CASE
        WHEN v_novo_status = 'pago'
          THEN now()
        ELSE NULL
      END,

    juros =
      COALESCE(juros, 0)
      + v_juros,

    desconto =
      COALESCE(desconto, 0)
      + v_desconto,

    conta_bancaria_id =
      COALESCE(
        _conta_bancaria_id,
        conta_bancaria_id
      ),

    forma_pagamento =
      COALESCE(
        _forma_pagamento,
        forma_pagamento
      ),

    updated_at = now()

  WHERE id = _conta_id;


  INSERT INTO public.movimentos_financeiros (
    data,
    tipo,
    origem,
    valor,
    conta_bancaria_id,
    centro_custo_id,
    conta_receber_id,
    forma_pagamento,
    documento,
    descricao,
    user_id
  )
  VALUES (
    COALESCE(_data, CURRENT_DATE),
    'entrada',
    'contas_receber',

    /* dinheiro efetivamente recebido */
    _valor_pago,

    _conta_bancaria_id,
    c.centro_custo_id,
    _conta_id,
    _forma_pagamento,
    c.documento,

    'Recebimento: '
      || COALESCE(c.descricao, '')
      || CASE
           WHEN NULLIF(btrim(_observacao), '') IS NOT NULL
             THEN ' - ' || btrim(_observacao)
           ELSE ''
         END,

    auth.uid()
  )
  RETURNING id
  INTO v_mov_id;


  RETURN v_mov_id;

END;
$function$;


CREATE OR REPLACE FUNCTION public.liquidar_conta_pagar(
  _conta_id uuid,
  _valor_pago numeric,
  _data date DEFAULT CURRENT_DATE,
  _conta_bancaria_id uuid DEFAULT NULL,
  _forma_pagamento text DEFAULT NULL,
  _juros numeric DEFAULT 0,
  _desconto numeric DEFAULT 0,
  _observacao text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.contas_pagar%ROWTYPE;

  v_mov_id uuid;

  v_juros numeric :=
    COALESCE(_juros, 0);

  v_desconto numeric :=
    COALESCE(_desconto, 0);

  v_principal_baixado numeric;
BEGIN

  SELECT *
  INTO c
  FROM public.contas_pagar
  WHERE id = _conta_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Conta a pagar % não encontrada',
      _conta_id;
  END IF;


  IF c.status = 'paga' THEN
    RAISE EXCEPTION
      'Conta já liquidada';
  END IF;


  IF c.status = 'cancelada' THEN
    RAISE EXCEPTION
      'Conta cancelada não pode ser liquidada';
  END IF;


  IF _valor_pago IS NULL
     OR _valor_pago <= 0 THEN

    RAISE EXCEPTION
      'Valor pago deve ser maior que zero';

  END IF;


  IF v_juros < 0 THEN
    RAISE EXCEPTION
      'Juros não podem ser negativos';
  END IF;


  IF v_desconto < 0 THEN
    RAISE EXCEPTION
      'Desconto não pode ser negativo';
  END IF;


  /*
   * Conta a pagar atual não possui status parcial.
   * A RPC representa liquidação integral.
   *
   * dinheiro movimentado - juros + desconto
   * deve equivaler ao principal da conta.
   */
  v_principal_baixado :=
    _valor_pago - v_juros + v_desconto;


  IF v_principal_baixado <> c.valor THEN

    RAISE EXCEPTION
      'Liquidação deve quitar o principal integral: principal %, informado %',
      c.valor,
      v_principal_baixado;

  END IF;


  UPDATE public.contas_pagar
  SET
    status = 'paga',
    pago_em = now(),

    /*
     * valor_pago guarda o principal quitado.
     * movimentos_financeiros guarda o caixa real.
     */
    valor_pago = c.valor,

    juros = v_juros,
    desconto = v_desconto,

    conta_bancaria_id =
      COALESCE(
        _conta_bancaria_id,
        conta_bancaria_id
      ),

    forma_pagamento =
      COALESCE(
        _forma_pagamento,
        forma_pagamento
      ),

    observacao =
      COALESCE(
        NULLIF(btrim(_observacao), ''),
        observacao
      ),

    updated_at = now()

  WHERE id = _conta_id;


  INSERT INTO public.movimentos_financeiros (
    data,
    tipo,
    origem,
    valor,
    conta_bancaria_id,
    centro_custo_id,
    conta_pagar_id,
    forma_pagamento,
    documento,
    descricao,
    user_id
  )
  VALUES (
    COALESCE(_data, CURRENT_DATE),
    'saida',
    'contas_pagar',

    /* dinheiro efetivamente pago */
    _valor_pago,

    _conta_bancaria_id,
    c.centro_custo_id,
    _conta_id,
    _forma_pagamento,
    c.documento,

    'Liquidação: '
      || COALESCE(c.descricao, '')
      || CASE
           WHEN NULLIF(btrim(_observacao), '') IS NOT NULL
             THEN ' - ' || btrim(_observacao)
           ELSE ''
         END,

    auth.uid()
  )
  RETURNING id
  INTO v_mov_id;


  RETURN v_mov_id;

END;
$function$;


/*
 * SECURITY DEFINER:
 * não deixar execução implícita para PUBLIC/anon.
 */

REVOKE EXECUTE ON FUNCTION
  public.liquidar_conta_receber(
    uuid,
    numeric,
    date,
    uuid,
    text,
    numeric,
    numeric,
    text
  )
FROM PUBLIC, anon;


GRANT EXECUTE ON FUNCTION
  public.liquidar_conta_receber(
    uuid,
    numeric,
    date,
    uuid,
    text,
    numeric,
    numeric,
    text
  )
TO authenticated, service_role;


REVOKE EXECUTE ON FUNCTION
  public.liquidar_conta_pagar(
    uuid,
    numeric,
    date,
    uuid,
    text,
    numeric,
    numeric,
    text
  )
FROM PUBLIC, anon;


GRANT EXECUTE ON FUNCTION
  public.liquidar_conta_pagar(
    uuid,
    numeric,
    date,
    uuid,
    text,
    numeric,
    numeric,
    text
  )
TO authenticated, service_role;


COMMIT;
