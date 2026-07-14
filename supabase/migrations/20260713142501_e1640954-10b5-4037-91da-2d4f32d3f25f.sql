
-- ============ TABLE ============
CREATE TABLE IF NOT EXISTS public.op_reservas_lote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  op_item_id UUID NULL REFERENCES public.op_itens(id) ON DELETE SET NULL,
  item_tipo TEXT NOT NULL,       -- 'produto' | 'variante' | 'fio' | 'article' | 'componente'
  item_id UUID NULL,             -- ref_id do componente da BOM (pode ser nulo p/ genéricos)
  descricao TEXT NULL,
  lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE RESTRICT,
  quantidade_reservada NUMERIC(14,3) NOT NULL CHECK (quantidade_reservada >= 0),
  quantidade_consumida NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantidade_consumida >= 0),
  quantidade_liberada  NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantidade_liberada  >= 0),
  status TEXT NOT NULL DEFAULT 'reservada'
    CHECK (status IN ('reservada','parcialmente_consumida','consumida','liberada','cancelada')),
  observacao TEXT,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_reservas_lote TO authenticated;
GRANT ALL ON public.op_reservas_lote TO service_role;

ALTER TABLE public.op_reservas_lote ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservas_select_auth" ON public.op_reservas_lote;
CREATE POLICY "reservas_select_auth" ON public.op_reservas_lote FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reservas_write_auth" ON public.op_reservas_lote;
CREATE POLICY "reservas_write_auth" ON public.op_reservas_lote
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reservas_op   ON public.op_reservas_lote(op_id);
CREATE INDEX IF NOT EXISTS idx_reservas_lote ON public.op_reservas_lote(lote_id);
CREATE INDEX IF NOT EXISTS idx_reservas_item ON public.op_reservas_lote(item_tipo, item_id) WHERE status IN ('reservada','parcialmente_consumida');
CREATE INDEX IF NOT EXISTS idx_reservas_status ON public.op_reservas_lote(status);

DROP TRIGGER IF EXISTS trg_reservas_updated_at ON public.op_reservas_lote;
CREATE TRIGGER trg_reservas_updated_at BEFORE UPDATE ON public.op_reservas_lote
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VIEW: saldos ============
CREATE OR REPLACE VIEW public.vw_lotes_saldos
WITH (security_invoker = true) AS
SELECT
  l.id AS lote_id,
  l.tipo,
  l.item_id,
  l.numero_lote,
  l.quantidade_disponivel                                        AS saldo_fisico,
  COALESCE(r.reservado, 0)                                       AS saldo_reservado,
  GREATEST(0, l.quantidade_disponivel - COALESCE(r.reservado,0)) AS saldo_disponivel
FROM public.lotes l
LEFT JOIN LATERAL (
  SELECT SUM(GREATEST(0, quantidade_reservada - quantidade_consumida - quantidade_liberada)) AS reservado
  FROM public.op_reservas_lote
  WHERE lote_id = l.id
    AND status IN ('reservada','parcialmente_consumida')
) r ON true
WHERE l.habilitado = true;

GRANT SELECT ON public.vw_lotes_saldos TO authenticated;

-- ============ VIEW: reservas por OP ============
CREATE OR REPLACE VIEW public.vw_reservas_op
WITH (security_invoker = true) AS
SELECT
  r.id,
  r.op_id,
  o.numero AS op_numero,
  o.status AS op_status,
  r.op_item_id,
  r.item_tipo,
  r.item_id,
  r.descricao,
  r.lote_id,
  l.numero_lote,
  l.tipo AS lote_tipo,
  r.quantidade_reservada,
  r.quantidade_consumida,
  r.quantidade_liberada,
  GREATEST(0, r.quantidade_reservada - r.quantidade_consumida - r.quantidade_liberada) AS pendente,
  r.status,
  r.observacao,
  r.created_at,
  r.updated_at
FROM public.op_reservas_lote r
JOIN public.ordens_producao o ON o.id = r.op_id
JOIN public.lotes l ON l.id = r.lote_id;

GRANT SELECT ON public.vw_reservas_op TO authenticated;

-- ============ RPC: reservar materiais da OP ============
-- FIFO por data_entrada. Usa BOM do artigo vinculado ao produto do item da OP.
-- Retorna JSON { ok, reservas, faltas: [ { item_tipo, item_id, descricao, deficit } ] }
CREATE OR REPLACE FUNCTION public.op_reservar_materiais(_op_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_it RECORD;
  v_art_id UUID;
  v_bom RECORD;
  v_perda NUMERIC;
  v_qtd_kg NUMERIC;
  v_need NUMERIC;
  v_lote RECORD;
  v_alloc NUMERIC;
  v_reservado_ids UUID[] := ARRAY[]::UUID[];
  v_faltas JSONB := '[]'::JSONB;
  v_deficit NUMERIC;
  v_r_id UUID;
BEGIN
  -- trava a OP
  PERFORM 1 FROM public.ordens_producao WHERE id = _op_id FOR UPDATE;

  FOR v_it IN
    SELECT oi.id AS op_item_id, oi.product_id, oi.descricao AS desc_item,
           GREATEST(0, oi.quantidade_planejada - COALESCE(oi.quantidade_produzida,0)) AS qtd_kg
      FROM public.op_itens oi
     WHERE oi.op_id = _op_id
  LOOP
    IF v_it.qtd_kg <= 0 THEN CONTINUE; END IF;

    v_art_id := NULL;
    IF v_it.product_id IS NOT NULL THEN
      SELECT article_id INTO v_art_id FROM public.products WHERE id = v_it.product_id;
    END IF;
    IF v_art_id IS NULL THEN
      v_faltas := v_faltas || jsonb_build_object(
        'op_item_id', v_it.op_item_id, 'motivo', 'produto sem artigo vinculado',
        'descricao', v_it.desc_item);
      CONTINUE;
    END IF;

    FOR v_bom IN
      SELECT ref_tipo, ref_id, descricao, unidade, qtd_por_kg, fator_perda_pct
        FROM public.article_bom
       WHERE article_id = v_art_id
    LOOP
      v_perda := COALESCE(v_bom.fator_perda_pct,0)/100.0;
      v_need  := COALESCE(v_bom.qtd_por_kg,0) * v_it.qtd_kg * (1 + v_perda);
      IF v_need <= 0 THEN CONTINUE; END IF;

      -- Aloca FIFO nos lotes do componente
      IF v_bom.ref_id IS NULL THEN
        v_faltas := v_faltas || jsonb_build_object(
          'op_item_id', v_it.op_item_id, 'descricao', v_bom.descricao,
          'motivo', 'BOM sem referência de item (ref_id nulo)', 'deficit', v_need);
        CONTINUE;
      END IF;

      FOR v_lote IN
        SELECT l.id, l.numero_lote, l.quantidade_disponivel,
               GREATEST(0, l.quantidade_disponivel - COALESCE((
                 SELECT SUM(GREATEST(0, r.quantidade_reservada - r.quantidade_consumida - r.quantidade_liberada))
                   FROM public.op_reservas_lote r
                  WHERE r.lote_id = l.id AND r.status IN ('reservada','parcialmente_consumida')
               ),0)) AS disponivel
          FROM public.lotes l
         WHERE l.item_id = v_bom.ref_id AND l.habilitado = true
         ORDER BY l.data_entrada ASC, l.created_at ASC
         FOR UPDATE
      LOOP
        EXIT WHEN v_need <= 0;
        v_alloc := LEAST(v_lote.disponivel, v_need);
        IF v_alloc <= 0 THEN CONTINUE; END IF;

        INSERT INTO public.op_reservas_lote(
          op_id, op_item_id, item_tipo, item_id, descricao,
          lote_id, quantidade_reservada, status, created_by
        ) VALUES (
          _op_id, v_it.op_item_id, v_bom.ref_tipo, v_bom.ref_id, v_bom.descricao,
          v_lote.id, v_alloc, 'reservada', v_uid
        ) RETURNING id INTO v_r_id;

        v_reservado_ids := v_reservado_ids || v_r_id;
        v_need := v_need - v_alloc;
      END LOOP;

      IF v_need > 0 THEN
        v_faltas := v_faltas || jsonb_build_object(
          'op_item_id', v_it.op_item_id,
          'item_tipo', v_bom.ref_tipo, 'item_id', v_bom.ref_id,
          'descricao', v_bom.descricao, 'deficit', ROUND(v_need, 3));
      END IF;
    END LOOP;
  END LOOP;

  -- Evento OP
  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (_op_id, 'reservas_geradas',
          jsonb_build_object('reservas', to_jsonb(v_reservado_ids), 'faltas', v_faltas), v_uid);

  RETURN jsonb_build_object('ok', true, 'reservas', to_jsonb(v_reservado_ids), 'faltas', v_faltas);
END;
$$;

REVOKE ALL ON FUNCTION public.op_reservar_materiais(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.op_reservar_materiais(UUID) TO authenticated;

-- ============ RPC: consumir reserva ============
CREATE OR REPLACE FUNCTION public.op_consumir_reserva(_reserva_id UUID, _quantidade NUMERIC, _obs TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD; pend NUMERIC; novo_cons NUMERIC; novo_status TEXT;
BEGIN
  SELECT * INTO r FROM public.op_reservas_lote WHERE id = _reserva_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Reserva % não encontrada', _reserva_id; END IF;
  IF r.status NOT IN ('reservada','parcialmente_consumida') THEN
    RAISE EXCEPTION 'Reserva % em status % — não consumível', _reserva_id, r.status;
  END IF;
  pend := r.quantidade_reservada - r.quantidade_consumida - r.quantidade_liberada;
  IF _quantidade <= 0 OR _quantidade > pend THEN
    RAISE EXCEPTION 'Quantidade inválida (pendente %, tentado %)', pend, _quantidade;
  END IF;

  -- Movimenta estoque (baixa via kardex, já registra em estoque_movimentos)
  PERFORM public.kardex_movimentar(r.lote_id, 'producao', _quantidade, 'saida',
                                   COALESCE(_obs, 'Consumo reserva OP'),
                                   'OP:' || r.op_id::text);

  novo_cons := r.quantidade_consumida + _quantidade;
  novo_status := CASE WHEN novo_cons + r.quantidade_liberada >= r.quantidade_reservada
                      THEN 'consumida' ELSE 'parcialmente_consumida' END;

  UPDATE public.op_reservas_lote
     SET quantidade_consumida = novo_cons, status = novo_status, updated_at = now()
   WHERE id = _reserva_id;

  -- Registra consumo lógico da OP
  INSERT INTO public.op_consumos(op_id, lote_id, quantidade, user_id, observacao)
  VALUES (r.op_id, r.lote_id, _quantidade, auth.uid(), _obs);

  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (r.op_id, 'reserva_consumida',
          jsonb_build_object('reserva_id', _reserva_id, 'quantidade', _quantidade), auth.uid());

  RETURN _reserva_id;
END;
$$;

REVOKE ALL ON FUNCTION public.op_consumir_reserva(UUID, NUMERIC, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.op_consumir_reserva(UUID, NUMERIC, TEXT) TO authenticated;

-- ============ RPC: liberar reserva ============
CREATE OR REPLACE FUNCTION public.op_liberar_reserva(_reserva_id UUID, _quantidade NUMERIC DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD; pend NUMERIC; libera NUMERIC; novo_lib NUMERIC; novo_status TEXT;
BEGIN
  SELECT * INTO r FROM public.op_reservas_lote WHERE id = _reserva_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Reserva % não encontrada', _reserva_id; END IF;
  IF r.status IN ('consumida','cancelada','liberada') THEN
    RAISE EXCEPTION 'Reserva % já finalizada (%)', _reserva_id, r.status;
  END IF;
  pend := r.quantidade_reservada - r.quantidade_consumida - r.quantidade_liberada;
  libera := COALESCE(_quantidade, pend);
  IF libera <= 0 OR libera > pend THEN
    RAISE EXCEPTION 'Quantidade inválida (pendente %, tentado %)', pend, libera;
  END IF;
  novo_lib := r.quantidade_liberada + libera;
  novo_status := CASE
    WHEN r.quantidade_consumida = 0 AND novo_lib >= r.quantidade_reservada THEN 'liberada'
    WHEN novo_lib + r.quantidade_consumida >= r.quantidade_reservada
      AND r.quantidade_consumida > 0 THEN 'consumida'
    ELSE r.status
  END;
  UPDATE public.op_reservas_lote
     SET quantidade_liberada = novo_lib, status = novo_status, updated_at = now()
   WHERE id = _reserva_id;

  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (r.op_id, 'reserva_liberada',
          jsonb_build_object('reserva_id', _reserva_id, 'quantidade', libera), auth.uid());
  RETURN _reserva_id;
END;
$$;

REVOKE ALL ON FUNCTION public.op_liberar_reserva(UUID, NUMERIC) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.op_liberar_reserva(UUID, NUMERIC) TO authenticated;

-- ============ RPC: cancelar todas as reservas de uma OP ============
CREATE OR REPLACE FUNCTION public.op_cancelar_reservas_op(_op_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD; total INTEGER := 0;
BEGIN
  FOR r IN SELECT id FROM public.op_reservas_lote
            WHERE op_id = _op_id AND status IN ('reservada','parcialmente_consumida')
            FOR UPDATE
  LOOP
    PERFORM public.op_liberar_reserva(r.id, NULL);
    UPDATE public.op_reservas_lote SET status = 'cancelada', updated_at = now()
     WHERE id = r.id AND quantidade_consumida = 0;
    total := total + 1;
  END LOOP;
  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (_op_id, 'reservas_canceladas', jsonb_build_object('total', total), auth.uid());
  RETURN total;
END;
$$;

REVOKE ALL ON FUNCTION public.op_cancelar_reservas_op(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.op_cancelar_reservas_op(UUID) TO authenticated;

-- ============ RPC: substituir lote ============
CREATE OR REPLACE FUNCTION public.op_substituir_lote(_reserva_id UUID, _novo_lote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD; l_novo RECORD; pend NUMERIC; disp NUMERIC; nova_id UUID;
BEGIN
  SELECT * INTO r FROM public.op_reservas_lote WHERE id = _reserva_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Reserva % não encontrada', _reserva_id; END IF;
  IF r.status NOT IN ('reservada','parcialmente_consumida') THEN
    RAISE EXCEPTION 'Reserva % em status % — não substituível', _reserva_id, r.status;
  END IF;
  SELECT * INTO l_novo FROM public.lotes WHERE id = _novo_lote_id AND habilitado = true FOR UPDATE;
  IF l_novo IS NULL THEN RAISE EXCEPTION 'Lote destino % inválido', _novo_lote_id; END IF;

  pend := r.quantidade_reservada - r.quantidade_consumida - r.quantidade_liberada;
  IF pend <= 0 THEN RAISE EXCEPTION 'Reserva sem saldo pendente'; END IF;

  SELECT GREATEST(0, l_novo.quantidade_disponivel - COALESCE((
      SELECT SUM(GREATEST(0, quantidade_reservada - quantidade_consumida - quantidade_liberada))
        FROM public.op_reservas_lote
       WHERE lote_id = l_novo.id AND status IN ('reservada','parcialmente_consumida')
    ),0))
    INTO disp;
  IF disp < pend THEN
    RAISE EXCEPTION 'Lote destino sem saldo disponível (disp %, precisa %)', disp, pend;
  END IF;

  -- Libera o pendente na reserva antiga
  UPDATE public.op_reservas_lote
     SET quantidade_liberada = quantidade_liberada + pend,
         status = CASE WHEN quantidade_consumida > 0 THEN 'consumida' ELSE 'liberada' END,
         updated_at = now()
   WHERE id = _reserva_id;

  -- Cria nova reserva no lote destino
  INSERT INTO public.op_reservas_lote(
    op_id, op_item_id, item_tipo, item_id, descricao,
    lote_id, quantidade_reservada, status, created_by, observacao
  ) VALUES (
    r.op_id, r.op_item_id, r.item_tipo, r.item_id, r.descricao,
    _novo_lote_id, pend, 'reservada', auth.uid(),
    'Substituição do lote ' || r.lote_id::text
  ) RETURNING id INTO nova_id;

  INSERT INTO public.op_eventos(op_id, tipo, payload, user_id)
  VALUES (r.op_id, 'reserva_substituida',
          jsonb_build_object('reserva_origem', _reserva_id, 'reserva_nova', nova_id,
                             'lote_origem', r.lote_id, 'lote_novo', _novo_lote_id,
                             'quantidade', pend), auth.uid());
  RETURN nova_id;
END;
$$;

REVOKE ALL ON FUNCTION public.op_substituir_lote(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.op_substituir_lote(UUID, UUID) TO authenticated;
