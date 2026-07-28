-- FASE 1: MODELO INDUSTRIAL - FUNDAÇÃO TÉCNICA E OPERACIONAL

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
    unidade_capacidade TEXT, -- kg/h, metros/h, etc
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
    categoria TEXT NOT NULL, -- manutenção, falta_material, troca_artigo, etc
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

-- 6. Evolução da tabela de Maquinas existente (public.maquinas)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'centro_trabalho_id') THEN
        ALTER TABLE public.maquinas ADD COLUMN centro_trabalho_id UUID REFERENCES public.centros_trabalho(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'fabricante') THEN
        ALTER TABLE public.maquinas ADD COLUMN fabricante TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'serial') THEN
        ALTER TABLE public.maquinas ADD COLUMN serial TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'ano') THEN
        ALTER TABLE public.maquinas ADD COLUMN ano INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'capacidade_nominal') THEN
        ALTER TABLE public.maquinas ADD COLUMN capacidade_nominal NUMERIC(15,4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'unidade_produtiva') THEN
        ALTER TABLE public.maquinas ADD COLUMN unidade_produtiva TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'velocidade_nominal') THEN
        ALTER TABLE public.maquinas ADD COLUMN velocidade_nominal NUMERIC(15,4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'largura_min') THEN
        ALTER TABLE public.maquinas ADD COLUMN largura_min NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'largura_max') THEN
        ALTER TABLE public.maquinas ADD COLUMN largura_max NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'gramatura_min') THEN
        ALTER TABLE public.maquinas ADD COLUMN gramatura_min NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'gramatura_max') THEN
        ALTER TABLE public.maquinas ADD COLUMN gramatura_max NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'eficiencia_esperada') THEN
        ALTER TABLE public.maquinas ADD COLUMN eficiencia_esperada NUMERIC(5,2) DEFAULT 85.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'custo_hora') THEN
        ALTER TABLE public.maquinas ADD COLUMN custo_hora NUMERIC(15,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'consumo_energetico') THEN
        ALTER TABLE public.maquinas ADD COLUMN consumo_energetico NUMERIC(15,4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'horimetro') THEN
        ALTER TABLE public.maquinas ADD COLUMN horimetro NUMERIC(15,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'status_operacional') THEN
        ALTER TABLE public.maquinas ADD COLUMN status_operacional TEXT DEFAULT 'disponivel';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'data_aquisicao') THEN
        ALTER TABLE public.maquinas ADD COLUMN data_aquisicao DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'data_ativacao') THEN
        ALTER TABLE public.maquinas ADD COLUMN data_ativacao DATE;
    END IF;
END $$;

-- 7. RLS e Grants

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades_industriais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_trabalho TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivos_parada TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_setup TO authenticated;

GRANT ALL ON public.unidades_industriais TO service_role;
GRANT ALL ON public.setores TO service_role;
GRANT ALL ON public.centros_trabalho TO service_role;
GRANT ALL ON public.motivos_parada TO service_role;
GRANT ALL ON public.tipos_setup TO service_role;

ALTER TABLE public.unidades_industriais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivos_parada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_setup ENABLE ROW LEVEL SECURITY;

-- Policies Simples (Base)
CREATE POLICY "Acesso autenticado - unidades" ON public.unidades_industriais FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - setores" ON public.setores FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - centros" ON public.centros_trabalho FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - motivos" ON public.motivos_parada FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - setups" ON public.tipos_setup FOR ALL TO authenticated USING (true);

