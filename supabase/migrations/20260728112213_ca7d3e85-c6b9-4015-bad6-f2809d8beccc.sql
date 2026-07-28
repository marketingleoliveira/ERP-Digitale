-- RE-APPLYING FOUNDATION + SPRINT 2 + SPRINT 2.5

-- 1. Unidades Industriais
CREATE TABLE IF NOT EXISTS public.unidades_industriais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cnpj TEXT,
    endereco TEXT,
    municipio TEXT,
    estado TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    responsavel_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Setores
CREATE TABLE IF NOT EXISTS public.setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES public.unidades_industriais(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    responsavel_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(unidade_id, codigo)
);

-- 3. Centros de Trabalho
CREATE TABLE IF NOT EXISTS public.centros_trabalho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID REFERENCES public.setores(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo_processo TEXT,
    capacidade_nominal NUMERIC(15,4),
    unidade_capacidade TEXT,
    eficiencia_padrao NUMERIC(5,2) DEFAULT 100.00,
    custo_hora NUMERIC(15,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    permite_simultaneo BOOLEAN DEFAULT false,
    max_operacoes_simultaneas INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(setor_id, codigo)
);

-- 4. Motivos de Parada
CREATE TABLE IF NOT EXISTS public.motivos_parada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    conta_como_parada_planejada BOOLEAN DEFAULT false,
    impacta_oee BOOLEAN DEFAULT true,
    exige_justificativa BOOLEAN DEFAULT true,
    exige_aprovacao BOOLEAN DEFAULT false,
    gera_manutencao BOOLEAN DEFAULT false,
    bloqueia_maquina BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tipos de Setup
CREATE TABLE IF NOT EXISTS public.tipos_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    duracao_padrao_minutos INTEGER DEFAULT 0,
    custo_estimado NUMERIC(15,2) DEFAULT 0.00,
    exige_aprovacao BOOLEAN DEFAULT false,
    checklist_obrigatorio BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Processos Industriais
CREATE TABLE IF NOT EXISTS public.processos_industriais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    setor_id UUID REFERENCES public.setores(id),
    centro_trabalho_padrao_id UUID REFERENCES public.centros_trabalho(id),
    duracao_padrao_minutos INTEGER DEFAULT 0,
    custo_padrao NUMERIC(15,2) DEFAULT 0.00,
    sequencia_sugerida INTEGER,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Roteiros de Produção
CREATE TABLE IF NOT EXISTS public.roteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artigo_id UUID REFERENCES public.artigos(id) ON DELETE CASCADE,
    versao INTEGER NOT NULL DEFAULT 1,
    revisao TEXT DEFAULT 'A',
    revisao_anterior_id UUID REFERENCES public.roteiros(id),
    data_vigencia DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'obsoleto', 'suspenso')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(artigo_id, versao, revisao)
);

-- 8. Operações do Roteiro
CREATE TABLE IF NOT EXISTS public.roteiro_operacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roteiro_id UUID REFERENCES public.roteiros(id) ON DELETE CASCADE,
    sequencia INTEGER NOT NULL,
    processo_id UUID REFERENCES public.processos_industriais(id),
    centro_trabalho_id UUID REFERENCES public.centros_trabalho(id),
    tempo_setup_minutos INTEGER DEFAULT 0,
    tempo_operacao_minutos INTEGER DEFAULT 0,
    tempo_limpeza_minutos INTEGER DEFAULT 0,
    tempo_inspecao_minutos INTEGER DEFAULT 0,
    tempo_troca_minutos INTEGER DEFAULT 0,
    tempo_espera_minutos INTEGER DEFAULT 0,
    tempo_adm_minutos INTEGER DEFAULT 0,
    custo_hora NUMERIC(15,2),
    obrigatoria BOOLEAN DEFAULT true,
    checklist_operacional JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Máquinas Compatíveis
CREATE TABLE IF NOT EXISTS public.roteiro_operacao_maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id UUID REFERENCES public.roteiro_operacoes(id) ON DELETE CASCADE,
    maquina_id UUID REFERENCES public.maquinas(id) ON DELETE CASCADE,
    prioridade INTEGER DEFAULT 1,
    preferencial BOOLEAN DEFAULT false,
    largura_min NUMERIC(10,2),
    largura_max NUMERIC(10,2),
    gramatura_min NUMERIC(10,2),
    gramatura_max NUMERIC(10,2),
    velocidade_nominal NUMERIC(15,2),
    eficiencia_esperada NUMERIC(5,2),
    capacidade_hora NUMERIC(15,2),
    custo_hora NUMERIC(15,2),
    restricoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(operacao_id, maquina_id)
);

-- 10. Parâmetros de Produção
CREATE TABLE IF NOT EXISTS public.roteiro_operacao_parametros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id UUID REFERENCES public.roteiro_operacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_referencia TEXT,
    tolerancia_min TEXT,
    tolerancia_max TEXT,
    obrigatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Matriz de Substituição
CREATE TABLE IF NOT EXISTS public.maquina_substituicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_principal_id UUID REFERENCES public.maquinas(id) ON DELETE CASCADE,
    maquina_reserva_id UUID REFERENCES public.maquinas(id) ON DELETE CASCADE,
    prioridade INTEGER DEFAULT 1,
    motivo_uso TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(maquina_principal_id, maquina_reserva_id)
);

-- 12. Auditoria Técnica
CREATE TABLE IF NOT EXISTS public.audit_engenharia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade_tipo TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    revisao TEXT NOT NULL,
    operacao TEXT NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Extensão de Maquinas Existentes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'centro_trabalho_id') THEN
        ALTER TABLE public.maquinas ADD COLUMN centro_trabalho_id UUID REFERENCES public.centros_trabalho(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'status_operacional') THEN
        ALTER TABLE public.maquinas ADD COLUMN status_operacional TEXT DEFAULT 'disponivel';
    END IF;
END $$;

-- 14. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades_industriais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_trabalho TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivos_parada TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_setup TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos_industriais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_operacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_operacao_maquinas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_operacao_parametros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquina_substituicao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_engenharia TO authenticated;

GRANT ALL ON public.unidades_industriais TO service_role;
GRANT ALL ON public.setores TO service_role;
GRANT ALL ON public.centros_trabalho TO service_role;
GRANT ALL ON public.motivos_parada TO service_role;
GRANT ALL ON public.tipos_setup TO service_role;
GRANT ALL ON public.processos_industriais TO service_role;
GRANT ALL ON public.roteiros TO service_role;
GRANT ALL ON public.roteiro_operacoes TO service_role;
GRANT ALL ON public.roteiro_operacao_maquinas TO service_role;
GRANT ALL ON public.roteiro_operacao_parametros TO service_role;
GRANT ALL ON public.maquina_substituicao TO service_role;
GRANT ALL ON public.audit_engenharia TO service_role;

-- 15. RLS
ALTER TABLE public.unidades_industriais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivos_parada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_industriais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiro_operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiro_operacao_maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiro_operacao_parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquina_substituicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_engenharia ENABLE ROW LEVEL SECURITY;

-- 16. Policies
CREATE POLICY "Acesso autenticado - unidades" ON public.unidades_industriais FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - setores" ON public.setores FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - centros" ON public.centros_trabalho FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - motivos" ON public.motivos_parada FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - setups" ON public.tipos_setup FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - processos" ON public.processos_industriais FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - roteiros" ON public.roteiros FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - operacoes" ON public.roteiro_operacoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - maq_comp" ON public.roteiro_operacao_maquinas FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - parametros" ON public.roteiro_operacao_parametros FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - maq_sub" ON public.maquina_substituicao FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - audit_eng" ON public.audit_engenharia FOR ALL TO authenticated USING (true);
