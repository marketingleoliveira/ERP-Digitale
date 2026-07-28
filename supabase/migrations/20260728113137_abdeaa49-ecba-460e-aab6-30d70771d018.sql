-- SPRINT 3: APS FOUNDATION

-- 1. Calendário Industrial
CREATE TABLE IF NOT EXISTS public.calendario_industrial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES public.unidades_industriais(id),
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('util', 'feriado', 'folga', 'manutencao', 'parada_geral')),
    descricao TEXT,
    capacidade_percentual INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(unidade_id, data)
);

-- 2. Turnos de Trabalho
CREATE TABLE IF NOT EXISTS public.turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    intervalo_minutos INTEGER DEFAULT 60,
    dias_semana INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Seg, 7=Dom
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Programação APS (Carga de Máquina)
CREATE TABLE IF NOT EXISTS public.aps_programacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    op_id UUID REFERENCES public.ordens_producao(id),
    operacao_id UUID REFERENCES public.roteiro_operacoes(id),
    maquina_id UUID REFERENCES public.maquinas(id),
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    carga_minutos INTEGER NOT NULL,
    status TEXT DEFAULT 'planejado' CHECK (status IN ('planejado', 'simulacao', 'confirmado', 'execucao', 'concluido')),
    cenario_id UUID, -- NULL para oficial, UUID para simulações
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Grants e RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendario_industrial TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turnos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_programacao TO authenticated;

GRANT ALL ON public.calendario_industrial TO service_role;
GRANT ALL ON public.turnos TO service_role;
GRANT ALL ON public.aps_programacao TO service_role;

ALTER TABLE public.calendario_industrial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aps_programacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total autenticado - calendario" ON public.calendario_industrial FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total autenticado - turnos" ON public.turnos FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total autenticado - aps" ON public.aps_programacao FOR ALL TO authenticated USING (true);
