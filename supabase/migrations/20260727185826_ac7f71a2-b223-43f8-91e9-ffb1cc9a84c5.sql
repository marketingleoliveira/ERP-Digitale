-- Etapa 11: Faturamento, NF-e e Financeiro Integrados (Retry corrigido)

-- 1. Naturezas de Operação
CREATE TABLE IF NOT EXISTS public.naturezas_operacao (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao text NOT NULL,
    finalidade text NOT NULL CHECK (finalidade IN ('venda', 'venda_producao', 'bonificacao', 'amostra', 'devolucao_venda', 'devolucao_compra', 'remessa', 'retorno', 'industrializacao')),
    tipo_movimento text NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
    gera_financeiro boolean DEFAULT true,
    movimenta_estoque boolean DEFAULT true,
    cfop_interno text,
    cfop_externo text,
    mensagem_fixa text,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.naturezas_operacao TO authenticated;
GRANT ALL ON public.naturezas_operacao TO service_role;
ALTER TABLE public.naturezas_operacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total naturezas para autenticados" ON public.naturezas_operacao FOR ALL TO authenticated USING (true);

-- 2. Regras Tributárias (Já existe, apenas garantir grants se necessário)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_tributarias TO authenticated;
GRANT ALL ON public.regras_tributarias TO service_role;

-- 3. Pré-faturamento (Cabeçalho)
CREATE TABLE IF NOT EXISTS public.pre_faturamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expedicao_id uuid REFERENCES public.op_expedicoes(id),
    pedido_id uuid REFERENCES public.pedidos(id),
    cliente_id uuid REFERENCES public.customers(id),
    natureza_id uuid REFERENCES public.naturezas_operacao(id),
    status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'validado', 'em_emissao', 'faturado', 'cancelado')),
    valor_total numeric(15,2) DEFAULT 0,
    valor_produtos numeric(15,2) DEFAULT 0,
    valor_impostos numeric(15,2) DEFAULT 0,
    payload_fiscal jsonb,
    idempotency_key text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_faturamentos TO authenticated;
GRANT ALL ON public.pre_faturamentos TO service_role;
ALTER TABLE public.pre_faturamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total pre-faturamentos para autenticados" ON public.pre_faturamentos FOR ALL TO authenticated USING (true);

-- 4. Itens do Pré-faturamento
CREATE TABLE IF NOT EXISTS public.pre_faturamento_itens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pre_faturamento_id uuid REFERENCES public.pre_faturamentos(id) ON DELETE CASCADE,
    produto_id uuid, 
    descricao text,
    quantidade numeric(15,3),
    unidade text,
    valor_unitario numeric(15,4),
    valor_total numeric(15,2),
    cfop text,
    cst text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_faturamento_itens TO authenticated;
GRANT ALL ON public.pre_faturamento_itens TO service_role;
ALTER TABLE public.pre_faturamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total pre-faturamentos itens para autenticados" ON public.pre_faturamento_itens FOR ALL TO authenticated USING (true);

-- 5. Função para Simulação Fiscal
CREATE OR REPLACE FUNCTION public.simulate_sales_invoice(
    p_expedicao_id uuid,
    p_natureza_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_natureza record;
    v_expedicao record;
    v_itens jsonb;
BEGIN
    SELECT * INTO v_natureza FROM public.naturezas_operacao WHERE id = p_natureza_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Natureza de operação não encontrada'; END IF;

    SELECT e.*, c.razao_social
    INTO v_expedicao 
    FROM public.op_expedicoes e
    LEFT JOIN public.customers c ON c.id = e.transportadora_id
    WHERE e.id = p_expedicao_id;

    SELECT jsonb_agg(sub) INTO v_itens FROM (
        SELECT 
            'Simulação de Item' as descricao,
            100 as quantidade,
            'KG' as unidade,
            10.50 as valor_unitario,
            1050.00 as valor_total,
            v_natureza.cfop_interno as cfop,
            '000' as cst
    ) sub;

    RETURN jsonb_build_object(
        'cliente', COALESCE(v_expedicao.razao_social, 'Cliente Simulado'),
        'natureza', v_natureza.descricao,
        'valor_produtos', 1050.00,
        'valor_total', 1050.00,
        'itens', v_itens
    );
END;
$$;

-- 6. RPC: Finalizar Nota Fiscal Autorizada (Consolidação)
CREATE OR REPLACE FUNCTION public.finalize_authorized_sales_invoice(
    p_nota_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_nota record;
    v_vencimento date;
BEGIN
    SELECT * INTO v_nota FROM public.notas_fiscais WHERE id = p_nota_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Nota não encontrada'; END IF;
    
    IF COALESCE(v_nota.status_sefaz, '') != 'autorizada' THEN
        RAISE EXCEPTION 'Nota não autorizada na SEFAZ';
    END IF;

    v_vencimento := CURRENT_DATE + interval '30 days';
    
    INSERT INTO public.contas_receber (
        nota_fiscal_id,
        cliente_id,
        descricao,
        valor,
        vencimento,
        status,
        parcela,
        total_parcelas,
        forma_pagamento
    ) VALUES (
        v_nota.id,
        v_nota.cliente_id,
        'NF-e ' || COALESCE(v_nota.numero, 'S/N'),
        v_nota.valor_total,
        v_vencimento,
        'aberto',
        1,
        1,
        'boleto'
    );

    INSERT INTO public.movimentos_financeiros (
        tipo,
        valor,
        descricao,
        user_id
    ) VALUES (
        'receita',
        v_nota.valor_total,
        'Faturamento NF-e ' || COALESCE(v_nota.numero, 'S/N'),
        p_user_id
    );

    UPDATE public.notas_fiscais SET status = 'faturada' WHERE id = p_nota_id;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- Seeds
INSERT INTO public.naturezas_operacao (descricao, finalidade, tipo_movimento, cfop_interno, cfop_externo)
VALUES 
('Venda de Produção Própria', 'venda_producao', 'saida', '5101', '6101'),
('Remessa de Amostra Grátis', 'amostra', 'saida', '5911', '6911'),
('Retorno de Industrialização', 'retorno', 'saida', '5124', '6124')
ON CONFLICT DO NOTHING;
