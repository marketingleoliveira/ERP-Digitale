-- Inserindo dados de teste para a Reserva Transacional (Etapa 5) - IDs Fixos para o Teste
DO $$ 
DECLARE
    v_product_id uuid := '9783df75-12cd-460c-b1d5-558e1baef3a0';
    v_op_id uuid := '146b2ca6-0759-4bd7-97cc-c51465bea494';
    v_lote_id uuid := '79a69fa2-a350-4b38-839e-9b164c56d3cc';
BEGIN
    -- 1. Garante um produto
    INSERT INTO public.products (id, nome, codigo, unidade, ativo)
    VALUES (v_product_id, 'MATERIAL TESTE RESERVA', 'TESTE-RES-001', 'KG', true)
    ON CONFLICT (id) DO UPDATE SET ativo = true;

    -- 2. Garante uma OP (status 'planejada')
    INSERT INTO public.ordens_producao (id, numero, status, observacao)
    VALUES (v_op_id, 999999, 'planejada', 'OP TESTE RESERVA')
    ON CONFLICT (id) DO UPDATE SET status = 'planejada';

    -- 3. Garante um lote (tipo 'fio' conforme constraint detectada)
    INSERT INTO public.lotes (id, item_id, numero_lote, quantidade, quantidade_disponivel, tipo, habilitado)
    VALUES (v_lote_id, v_product_id, 'LOTE-TESTE-555', 1000, 1000, 'fio', true)
    ON CONFLICT (id) DO UPDATE SET quantidade_disponivel = 1000, quantidade = 1000;
END $$;
