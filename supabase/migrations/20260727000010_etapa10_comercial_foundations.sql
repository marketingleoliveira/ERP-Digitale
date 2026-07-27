-- ETAPA 10: FUNDAMENTOS DO MÓDULO COMERCIAL E LOGÍSTICA

-- 1. Expansão de Pedidos e Itens
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS empresa_id uuid,
ADD COLUMN IF NOT EXISTS filial_id uuid,
ADD COLUMN IF NOT EXISTS canal text,
ADD COLUMN IF NOT EXISTS moeda text DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS valor_produtos numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS acréscimos numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS frete numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

ALTER TABLE public.pedido_itens
ADD COLUMN IF NOT EXISTS artigo_id uuid,
ADD COLUMN IF NOT EXISTS quantidade_reservada numeric(14,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantidade_separada numeric(14,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantidade_conferida numeric(14,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantidade_expedida numeric(14,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantidade_cancelada numeric(14,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS observacao text;

-- 2. Reservas Comerciais
CREATE TABLE IF NOT EXISTS public.vendas_reservas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
    pedido_item_id uuid REFERENCES public.pedido_itens(id) ON DELETE CASCADE,
    lote_id uuid REFERENCES public.lotes(id) ON DELETE RESTRICT,
    rolo_id uuid REFERENCES public.lote_rolos(id) ON DELETE RESTRICT,
    quantidade numeric(14,3) NOT NULL CHECK (quantidade > 0),
    status text NOT NULL CHECK (status IN ('ativa', 'cancelada', 'consumida')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas_reservas TO authenticated;
GRANT ALL ON public.vendas_reservas TO service_role;
ALTER TABLE public.vendas_reservas ENABLE ROW LEVEL SECURITY;

-- 3. Conferências
CREATE TABLE IF NOT EXISTS public.conferencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    separacao_id uuid REFERENCES public.separacoes(id) ON DELETE CASCADE,
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
    conferente_id uuid REFERENCES auth.users(id),
    status text NOT NULL CHECK (status IN ('pendente', 'conformizada', 'divergente')),
    resultado jsonb DEFAULT '[]'::jsonb,
    divergencias jsonb DEFAULT '[]'::jsonb,
    observacao text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conferencias TO authenticated;
GRANT ALL ON public.conferencias TO service_role;
ALTER TABLE public.conferencias ENABLE ROW LEVEL SECURITY;

-- 4. Atualização de Lotes para Saldos Comerciais
ALTER TABLE public.lotes 
ADD COLUMN IF NOT EXISTS saldo_reservado_comercial numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_em_separacao numeric DEFAULT 0;

-- 5. RNC (Relatório de Não Conformidade) - Etapa 0.1
CREATE TABLE IF NOT EXISTS public.nao_conformidades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    descricao text,
    causa_raiz text,
    acao_corretiva text,
    responsavel_id uuid REFERENCES auth.users(id),
    lote_id uuid REFERENCES public.lotes(id),
    inspecao_id uuid REFERENCES public.inspecoes_qualidade(id),
    fornecedor_id uuid REFERENCES public.fornecedores(id),
    status text DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'concluida', 'cancelada')),
    prazo date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nao_conformidades TO authenticated;
GRANT ALL ON public.nao_conformidades TO service_role;
ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS Básicas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendas_reservas' AND policyname = 'vendas_reservas_auth_read') THEN
        CREATE POLICY vendas_reservas_auth_read ON public.vendas_reservas FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conferencias' AND policyname = 'conferencias_auth_read') THEN
        CREATE POLICY conferencias_auth_read ON public.conferencias FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nao_conformidades' AND policyname = 'nao_conformidades_auth_read') THEN
        CREATE POLICY nao_conformidades_auth_read ON public.nao_conformidades FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

