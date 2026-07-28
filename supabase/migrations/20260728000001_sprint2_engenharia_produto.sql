-- SPRINT 2: ENGENHARIA DE PRODUTO E ROTEIROS DE PRODUÇÃO

-- 1. Processos Industriais
CREATE TABLE IF NOT EXISTS public.processos_industriais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT, -- Preparação, Estamparia, etc.
    setor_id UUID REFERENCES public.setores(id),
    centro_trabalho_padrao_id UUID REFERENCES public.centros_trabalho(id),
    duracao_padrao_minutos INTEGER DEFAULT 0,
    custo_padrao NUMERIC(15,2) DEFAULT 0.00,
    sequencia_sugerida INTEGER,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Roteiros de Produção
CREATE TABLE IF NOT EXISTS public.roteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artigo_id UUID REFERENCES public.artigos(id) ON DELETE CASCADE,
    versao INTEGER NOT NULL DEFAULT 1,
    data_vigencia DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'obsoleto', 'suspenso')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(artigo_id, versao)
);

-- 3. Operações do Roteiro
CREATE TABLE IF NOT EXISTS public.roteiro_operacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roteiro_id UUID REFERENCES public.roteiros(id) ON DELETE CASCADE,
    sequencia INTEGER NOT NULL,
    processo_id UUID REFERENCES public.processos_industriais(id),
    centro_trabalho_id UUID REFERENCES public.centros_trabalho(id),
    tempo_setup_minutos INTEGER DEFAULT 0,
    tempo_operacao_minutos INTEGER DEFAULT 0,
    custo_hora NUMERIC(15,2),
    obrigatoria BOOLEAN DEFAULT true,
    checklist_operacional JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Máquinas Compatíveis por Operação
CREATE TABLE IF NOT EXISTS public.roteiro_operacao_maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id UUID REFERENCES public.roteiro_operacoes(id) ON DELETE CASCADE,
    maquina_id UUID REFERENCES public.maquinas(id) ON DELETE CASCADE,
    preferencial BOOLEAN DEFAULT false,
    restricoes JSONB DEFAULT '{}'::jsonb, -- largura_min, gramatura_max, etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(operacao_id, maquina_id)
);

-- 5. Extensão de Artigos (Ficha Técnica)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artigos' AND column_name = 'composicao') THEN
        ALTER TABLE public.artigos ADD COLUMN composicao TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artigos' AND column_name = 'rendimento') THEN
        ALTER TABLE public.artigos ADD COLUMN rendimento NUMERIC(10,4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artigos' AND column_name = 'parametros_produtivos') THEN
        ALTER TABLE public.artigos ADD COLUMN parametros_produtivos JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artigos' AND column_name = 'parametros_qualidade') THEN
        ALTER TABLE public.artigos ADD COLUMN parametros_qualidade JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 6. RLS e Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos_industriais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_operacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_operacao_maquinas TO authenticated;

GRANT ALL ON public.processos_industriais TO service_role;
GRANT ALL ON public.roteiros TO service_role;
GRANT ALL ON public.roteiro_operacoes TO service_role;
GRANT ALL ON public.roteiro_operacao_maquinas TO service_role;

ALTER TABLE public.processos_industriais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiro_operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiro_operacao_maquinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso autenticado - processos" ON public.processos_industriais FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - roteiros" ON public.roteiros FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - operacoes" ON public.roteiro_operacoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso autenticado - maq_comp" ON public.roteiro_operacao_maquinas FOR ALL TO authenticated USING (true);

