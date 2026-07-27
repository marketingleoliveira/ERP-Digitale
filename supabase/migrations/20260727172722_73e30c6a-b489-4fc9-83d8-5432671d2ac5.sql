-- Inserindo dados de teste para a Reserva Transacional (Etapa 5) - Corrigido com Tipo de Lote válido
DO $$ 
DECLARE
    v_product_id uuid;
    v_op_id uuid;
BEGIN
    -- 1. Garante um produto
    INSERT INTO public.products (nome, codigo, unidade, ativo)
    VALUES ('MATERIAL TESTE RESERVA', 'TESTE-RES-001', 'KG', true)
    ON CONFLICT (id) DO NOTHING;
    SELECT id INTO v_product_id FROM public.products WHERE codigo = 'TESTE-RES-001';

    -- 2. Garante uma OP (status 'planejada')
    INSERT INTO public.ordens_producao (numero, status, observacao)
    VALUES (999999, 'planejada', 'OP TESTE RESERVA')
    ON CONFLICT (id) DO NOTHING;
    SELECT id INTO v_op_id FROM public.ordens_producao WHERE numero = 999999;

    -- 3. Garante um lote (tipo 'fio' conforme constraint detectada)
    INSERT INTO public.lotes (item_id, numero_lote, quantidade, quantidade_disponivel, tipo, habilitado)
    VALUES (v_product_id, 'LOTE-TESTE-555', 100, 100, 'fio', true)
    ON CONFLICT (id) DO NOTHING;
END $$;
