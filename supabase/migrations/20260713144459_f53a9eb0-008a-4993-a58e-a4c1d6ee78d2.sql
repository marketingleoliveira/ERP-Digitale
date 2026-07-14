DO $$
DECLARE
  v_forn uuid; v_cli uuid; v_fio uuid; v_art uuid; v_var uuid; v_cor uuid;
  v_rot uuid; v_maq uuid; v_lote uuid; v_prod uuid; v_ped uuid;
BEGIN
  SELECT id INTO v_forn FROM public.fornecedores WHERE razao_social='SEED FORN LTDA';
  IF v_forn IS NULL THEN
    INSERT INTO public.fornecedores(razao_social, cnpj, ativo) VALUES ('SEED FORN LTDA','00.000.000/0001-00', true) RETURNING id INTO v_forn;
  END IF;
  SELECT id INTO v_cli FROM public.customers WHERE razao_social='SEED CLI LTDA';
  IF v_cli IS NULL THEN
    INSERT INTO public.customers(razao_social, cnpj, status) VALUES ('SEED CLI LTDA','11.111.111/0001-11','ativo') RETURNING id INTO v_cli;
  END IF;
  SELECT id INTO v_fio FROM public.fios WHERE codigo='SEED-FIO-01';
  IF v_fio IS NULL THEN
    INSERT INTO public.fios(codigo, tipo, titulo, composicao, habilitado) VALUES ('SEED-FIO-01','PA', 30, '100% PA', true) RETURNING id INTO v_fio;
  END IF;
  SELECT id INTO v_art FROM public.articles WHERE codigo='SEED-ART-01';
  IF v_art IS NULL THEN
    INSERT INTO public.articles(codigo, nome, categoria, composicao, gramatura, ativo) VALUES ('SEED-ART-01','Malha SEED PA','malha','100% PA',180,true) RETURNING id INTO v_art;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.article_bom WHERE article_id=v_art AND ref_id=v_fio) THEN
    INSERT INTO public.article_bom(article_id, tipo, ref_tipo, ref_id, descricao, qtd_por_kg, unidade, fator_perda_pct)
    VALUES (v_art,'fio','fio', v_fio,'SEED-FIO-01', 1.05,'KG', 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.article_fios WHERE article_id=v_art AND fio_id=v_fio) THEN
    INSERT INTO public.article_fios(article_id, fio_id, fio_descricao, qtd_cones, porcentagem)
    VALUES (v_art, v_fio, 'SEED-FIO-01', 1, 100);
  END IF;
  SELECT id INTO v_var FROM public.variantes WHERE nome='SEED-VAR';
  IF v_var IS NULL THEN
    INSERT INTO public.variantes(nome, habilitado) VALUES ('SEED-VAR', true) RETURNING id INTO v_var;
  END IF;
  SELECT id INTO v_cor FROM public.cores WHERE codigo='SEED-COR';
  IF v_cor IS NULL THEN
    INSERT INTO public.cores(codigo, tipo, cor, habilitado) VALUES ('SEED-COR','PIGMENTO','Branco', true) RETURNING id INTO v_cor;
  END IF;
  SELECT id INTO v_rot FROM public.roteiros WHERE codigo='SEED-ROT-01';
  IF v_rot IS NULL THEN
    INSERT INTO public.roteiros(codigo, descricao, article_id, revisao, ativo, tempo_padrao_min, setup_min)
    VALUES ('SEED-ROT-01','Roteiro SEED', v_art, 1, true, 60, 15) RETURNING id INTO v_rot;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roteiro_etapas WHERE roteiro_id=v_rot AND sequencia=1) THEN
    INSERT INTO public.roteiro_etapas(roteiro_id, sequencia, nome_operacao, tempo_padrao_min, setup_min, qualidade_obrigatoria, terceirizada)
    VALUES (v_rot, 1, 'Tecelagem', 60, 15, true, false);
  END IF;
  SELECT id INTO v_maq FROM public.maquinas WHERE numero=9001;
  IF v_maq IS NULL THEN
    INSERT INTO public.maquinas(numero, tipo, maquina, modelo, habilitado)
    VALUES (9001,'circular','SEED-M-01','Modelo SEED', true) RETURNING id INTO v_maq;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.maquina_capacidade WHERE maquina_id=v_maq) THEN
    INSERT INTO public.maquina_capacidade(maquina_id, kg_por_hora, horas_por_turno, turnos_por_dia, dias_uteis_semana, eficiencia_alvo_pct)
    VALUES (v_maq, 25, 8, 2, 5, 85);
  END IF;
  SELECT id INTO v_lote FROM public.lotes WHERE numero_lote='SEED-LOTE-01' AND item_id=v_fio;
  IF v_lote IS NULL THEN
    INSERT INTO public.lotes(tipo, item_id, numero_lote, quantidade, quantidade_disponivel, data_entrada, habilitado, custo_unitario)
    VALUES ('fio', v_fio, 'SEED-LOTE-01', 500, 500, CURRENT_DATE, true, 25.00) RETURNING id INTO v_lote;
  END IF;
  SELECT id INTO v_prod FROM public.products WHERE codigo='SEED-PROD-01';
  IF v_prod IS NULL THEN
    INSERT INTO public.products(codigo, nome, categoria, unidade, ativo, article_id, preco_venda)
    VALUES ('SEED-PROD-01','Produto SEED','malha','KG', true, v_art, 50.00) RETURNING id INTO v_prod;
  ELSE
    UPDATE public.products SET article_id=v_art WHERE id=v_prod AND article_id IS NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_variants WHERE sku='SEED-SKU-01') THEN
    INSERT INTO public.product_variants(product_id, sku, cor, tamanho, estoque, estoque_minimo)
    VALUES (v_prod,'SEED-SKU-01','Branco','UN', 0, 0);
  END IF;
  SELECT id INTO v_ped FROM public.pedidos WHERE numero='SEED-PED-001';
  IF v_ped IS NULL THEN
    INSERT INTO public.pedidos(numero, cliente_id, data_pedido, prazo_entrega, status, valor_total, condicao_pagamento)
    VALUES ('SEED-PED-001', v_cli, CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'confirmado', 15000, '30 dias')
    RETURNING id INTO v_ped;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pedido_itens WHERE pedido_id=v_ped AND product_id=v_prod) THEN
    INSERT INTO public.pedido_itens(pedido_id, product_id, variante_id, cor_id, descricao, quantidade, unidade, valor_unitario)
    VALUES (v_ped, v_prod, v_var, v_cor, 'Produto SEED - 300 kg', 300, 'KG', 50.00);
  END IF;
  INSERT INTO public.calendario_produtivo(data, tipo)
  SELECT d::date, 'util'
  FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day') d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
    AND NOT EXISTS (SELECT 1 FROM public.calendario_produtivo c WHERE c.data = d::date);
END $$;

DO $$
DECLARE r record;
BEGIN
  SELECT
    (SELECT count(*) FROM public.pedidos WHERE numero='SEED-PED-001' AND status='confirmado') as ped,
    (SELECT count(*) FROM public.products p JOIN public.articles a ON a.id=p.article_id WHERE p.codigo='SEED-PROD-01') as prod_art,
    (SELECT count(*) FROM public.article_bom b JOIN public.articles a ON a.id=b.article_id WHERE a.codigo='SEED-ART-01') as bom,
    (SELECT count(*) FROM public.roteiros WHERE codigo='SEED-ROT-01' AND ativo) as rot,
    (SELECT count(*) FROM public.maquina_capacidade mc JOIN public.maquinas m ON m.id=mc.maquina_id WHERE m.numero=9001) as cap,
    (SELECT count(*) FROM public.lotes WHERE numero_lote='SEED-LOTE-01' AND habilitado) as lote
  INTO r;
  RAISE NOTICE 'SEED VALIDATION: pedido=% prod_art=% bom=% roteiro=% capacidade=% lote=%', r.ped, r.prod_art, r.bom, r.rot, r.cap, r.lote;
  IF r.ped=0 OR r.prod_art=0 OR r.bom=0 OR r.rot=0 OR r.cap=0 OR r.lote=0 THEN
    RAISE EXCEPTION 'Seed E2E incompleto';
  END IF;
END $$;