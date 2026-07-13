
-- =========================================================
-- Sprint 0 PCP — Turnos, Calendário e Máquina×Turno
-- =========================================================

-- 1) TURNOS
CREATE TABLE public.turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  dias_semana INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- 0=dom .. 6=sáb
  intervalo_min INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.turnos TO authenticated;
GRANT ALL ON public.turnos TO service_role;

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turnos_select_auth" ON public.turnos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "turnos_write_gerente" ON public.turnos
  FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TRIGGER trg_turnos_updated_at
  BEFORE UPDATE ON public.turnos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) CALENDÁRIO PRODUTIVO
CREATE TABLE public.calendario_produtivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('util','feriado','manutencao','parada')),
  turno_id UUID REFERENCES public.turnos(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (data, turno_id)
);

CREATE INDEX idx_calendario_data ON public.calendario_produtivo(data);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendario_produtivo TO authenticated;
GRANT ALL ON public.calendario_produtivo TO service_role;

ALTER TABLE public.calendario_produtivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cal_select_auth" ON public.calendario_produtivo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cal_write_gerente" ON public.calendario_produtivo
  FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TRIGGER trg_calendario_updated_at
  BEFORE UPDATE ON public.calendario_produtivo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) MÁQUINA × TURNO
CREATE TABLE public.maquina_turnos (
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (maquina_id, turno_id)
);

CREATE INDEX idx_maquina_turnos_turno ON public.maquina_turnos(turno_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquina_turnos TO authenticated;
GRANT ALL ON public.maquina_turnos TO service_role;

ALTER TABLE public.maquina_turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mt_select_auth" ON public.maquina_turnos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "mt_write_gerente" ON public.maquina_turnos
  FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));
