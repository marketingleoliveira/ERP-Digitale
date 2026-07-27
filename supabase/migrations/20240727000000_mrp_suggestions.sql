-- Enum for MRP suggestion status
DO $$ BEGIN
    CREATE TYPE public.mrp_suggestion_status AS ENUM (
        'SUGERIDA', 
        'EM_ANALISE', 
        'APROVADA', 
        'REJEITADA', 
        'EM_COTACAO', 
        'PARCIALMENTE_CONVERTIDA', 
        'CONVERTIDA', 
        'CANCELADA', 
        'DESATUALIZADA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table for MRP Purchase Suggestions
CREATE TABLE IF NOT EXISTS public.mrp_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_tipo text NOT NULL CHECK (ref_tipo IN ('produto', 'variante', 'fio', 'outro')),
    ref_id uuid,
    descricao text NOT NULL,
    unidade text NOT NULL,
    necessidade_bruta numeric(14,3) NOT NULL DEFAULT 0,
    perda numeric(14,3) NOT NULL DEFAULT 0,
    estoque_fisico numeric(14,3) NOT NULL DEFAULT 0,
    estoque_disponivel numeric(14,3) NOT NULL DEFAULT 0,
    estoque_reservado numeric(14,3) NOT NULL DEFAULT 0,
    estoque_seguranca numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_em_transito numeric(14,3) NOT NULL DEFAULT 0,
    necessidade_liquida numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_sugerida numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_aprovada numeric(14,3) NOT NULL DEFAULT 0,
    quantidade_convertida numeric(14,3) NOT NULL DEFAULT 0,
    custo_unitario_estimado numeric(14,4),
    custo_total_estimado numeric(14,4),
    origem_custo text,
    fornecedor_sugerido_id uuid REFERENCES public.fornecedores(id),
    data_necessaria date,
    data_sugerida_compra date,
    prioridade text NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
    status mrp_suggestion_status NOT NULL DEFAULT 'SUGERIDA',
    justificativa text,
    motivo_rejeicao text,
    motivo_cancelamento text,
    versao_calculo integer NOT NULL DEFAULT 1,
    responsavel_id uuid REFERENCES auth.users(id),
    aprovador_id uuid REFERENCES auth.users(id),
    aprovada_em timestamptz,
    pedido_compra_id uuid REFERENCES public.pedidos_compra(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grant access to mrp_suggestions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mrp_suggestions TO authenticated;
GRANT ALL ON public.mrp_suggestions TO service_role;

-- Enable RLS
ALTER TABLE public.mrp_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for mrp_suggestions
CREATE POLICY "mrp_suggestions_read_auth" ON public.mrp_suggestions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "mrp_suggestions_write_mgmt" ON public.mrp_suggestions
    FOR ALL TO authenticated
    USING (has_any_role(auth.uid(), ARRAY['compras'::app_role, 'gerente'::app_role, 'admin'::app_role]))
    WITH CHECK (has_any_role(auth.uid(), ARRAY['compras'::app_role, 'gerente'::app_role, 'admin'::app_role]));

-- Table for MRP suggestion origins (traceability)
CREATE TABLE IF NOT EXISTS public.mrp_suggestion_origins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id uuid NOT NULL REFERENCES public.mrp_suggestions(id) ON DELETE CASCADE,
    op_id uuid REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    demanda_manual_id uuid, -- For future use
    quantidade numeric(14,3) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Grant access to mrp_suggestion_origins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mrp_suggestion_origins TO authenticated;
GRANT ALL ON public.mrp_suggestion_origins TO service_role;

-- Enable RLS
ALTER TABLE public.mrp_suggestion_origins ENABLE ROW LEVEL SECURITY;

-- Policies for mrp_suggestion_origins
CREATE POLICY "mrp_suggestion_origins_read_auth" ON public.mrp_suggestion_origins
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "mrp_suggestion_origins_write_mgmt" ON public.mrp_suggestion_origins
    FOR ALL TO authenticated
    USING (has_any_role(auth.uid(), ARRAY['compras'::app_role, 'gerente'::app_role, 'admin'::app_role]))
    WITH CHECK (has_any_role(auth.uid(), ARRAY['compras'::app_role, 'gerente'::app_role, 'admin'::app_role]));

-- Indexes
CREATE INDEX idx_mrp_suggestions_ref ON public.mrp_suggestions (ref_tipo, ref_id);
CREATE INDEX idx_mrp_suggestions_status ON public.mrp_suggestions (status);
CREATE INDEX idx_mrp_suggestions_data ON public.mrp_suggestions (data_necessaria);
CREATE INDEX idx_mrp_suggestion_origins_suggestion ON public.mrp_suggestion_origins (suggestion_id);

-- Trigger for updated_at
CREATE TRIGGER trg_mrp_suggestions_upd
    BEFORE UPDATE ON public.mrp_suggestions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

