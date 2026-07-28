-- SPRINT 2.5: FINALIZAÇÃO DA INFRAESTRUTURA

-- 1. Documentação Técnica
CREATE TABLE IF NOT EXISTS public.engenharia_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('roteiro', 'processo', 'artigo', 'maquina')),
    entidade_id UUID NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tipo_arquivo TEXT,
    versao TEXT,
    autor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Grants e RLS para Documentação
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engenharia_documentos TO authenticated;
GRANT ALL ON public.engenharia_documentos TO service_role;
ALTER TABLE public.engenharia_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total autenticado - docs_final" ON public.engenharia_documentos FOR ALL TO authenticated USING (true);

-- 3. Versionamento Final de Roteiros
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roteiros' AND column_name = 'revisao' AND data_type = 'integer') THEN
        ALTER TABLE public.roteiros ALTER COLUMN revisao TYPE TEXT USING revisao::TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roteiros' AND column_name = 'artigo_id') THEN
        ALTER TABLE public.roteiros ADD COLUMN artigo_id UUID REFERENCES public.articles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roteiros' AND column_name = 'versao') THEN
        ALTER TABLE public.roteiros ADD COLUMN versao INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roteiros' AND column_name = 'status') THEN
        ALTER TABLE public.roteiros ADD COLUMN status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'obsoleto', 'suspenso'));
    END IF;
END $$;
