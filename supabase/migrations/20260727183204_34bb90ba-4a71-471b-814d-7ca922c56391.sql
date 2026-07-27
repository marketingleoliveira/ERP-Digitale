
DO $$ BEGIN
    CREATE TYPE public.qualidade_status AS ENUM (
        'PENDENTE', 'EM_CONFERENCIA', 'AGUARDANDO_ENSAIO', 'AGUARDANDO_APROVACAO', 
        'APROVADA', 'APROVADA_COM_RESSALVA', 'REPROVADA', 'PARCIALMENTE_APROVADA', 
        'REPROCESSO', 'CANCELADA'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.lote_classificacao AS ENUM (
        'PRIMEIRA_QUALIDADE', 'SEGUNDA_QUALIDADE', 'SALDO', 'AMOSTRA', 
        'REPROCESSO', 'REFUGO', 'BLOQUEADO', 'PRODUTO_ACABADO'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.qualidade_planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    versao INTEGER NOT NULL DEFAULT 1,
    artigo_id UUID REFERENCES public.articles(id),
    vigencia_inicio TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'ativo',
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qualidade_plano_caracteristicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID REFERENCES public.qualidade_planos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_nominal NUMERIC,
    limite_min NUMERIC,
    limite_max NUMERIC
);

CREATE TABLE IF NOT EXISTS public.inspecoes_qualidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES public.lotes(id) NOT NULL,
    status public.qualidade_status DEFAULT 'PENDENTE',
    inspetor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lotes 
ADD COLUMN IF NOT EXISTS saldo_qualidade NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_aprovado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_bloqueado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS liberado_comercial BOOLEAN DEFAULT false;

GRANT ALL ON public.qualidade_planos TO authenticated;
GRANT ALL ON public.qualidade_plano_caracteristicas TO authenticated;
GRANT ALL ON public.inspecoes_qualidade TO authenticated;
ALTER TABLE public.qualidade_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualidade_plano_caracteristicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecoes_qualidade ENABLE ROW LEVEL SECURITY;
