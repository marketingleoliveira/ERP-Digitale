
-- 1. notas_fiscais: marcador de teste E2E
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS is_teste_e2e boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS notas_fiscais_teste_e2e_idx ON public.notas_fiscais(is_teste_e2e) WHERE is_teste_e2e = true;

-- Regra: qualquer nota marcada is_teste_e2e deve ter provedor_ref com prefixo TESTE-E2E-
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_teste_e2e_ref_chk') THEN
    ALTER TABLE public.notas_fiscais
      ADD CONSTRAINT notas_fiscais_teste_e2e_ref_chk
      CHECK (is_teste_e2e = false OR provedor_ref LIKE 'TESTE-E2E-%');
  END IF;
END $$;

-- 2. entrega_eventos: comprovante
ALTER TABLE public.entrega_eventos
  ADD COLUMN IF NOT EXISTS comprovante_path text,
  ADD COLUMN IF NOT EXISTS comprovante_mime text,
  ADD COLUMN IF NOT EXISTS comprovante_size bigint;

-- 3. Storage RLS para bucket entrega-comprovantes (bucket será criado via ferramenta dedicada)
-- Leitura: qualquer autenticado com cargo logistica/gerente/admin/desenvolvedor
DROP POLICY IF EXISTS "entrega_compr_read" ON storage.objects;
CREATE POLICY "entrega_compr_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'entrega-comprovantes'
    AND (
      public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gerente'::app_role)
      OR public.has_role(auth.uid(), 'logistica'::app_role)
    )
  );

DROP POLICY IF EXISTS "entrega_compr_write" ON storage.objects;
CREATE POLICY "entrega_compr_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'entrega-comprovantes'
    AND (
      public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gerente'::app_role)
      OR public.has_role(auth.uid(), 'logistica'::app_role)
    )
  );

DROP POLICY IF EXISTS "entrega_compr_update" ON storage.objects;
CREATE POLICY "entrega_compr_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'entrega-comprovantes'
    AND (
      public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gerente'::app_role)
      OR public.has_role(auth.uid(), 'logistica'::app_role)
    )
  );

DROP POLICY IF EXISTS "entrega_compr_delete" ON storage.objects;
CREATE POLICY "entrega_compr_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'entrega-comprovantes'
    AND (
      public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gerente'::app_role)
    )
  );

-- 4. Rollback SEED — apenas desenvolvedor
CREATE OR REPLACE FUNCTION public.seed_rollback()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_removed jsonb := '{}'::jsonb;
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'desenvolvedor'::app_role) THEN
    RAISE EXCEPTION 'Rollback SEED restrito a desenvolvedor';
  END IF;

  -- Ordem: eventos → expedição → romaneios → NF teste → contas → op filhas/consumos/apontamentos/qualidade/reservas/lotes acabados → op → pedido/itens → cliente_artigo → lote MP → BOM/roteiro/máquina/artigo/produto → cliente
  DELETE FROM public.entrega_eventos WHERE romaneio_id IN (SELECT id FROM public.romaneios WHERE numero LIKE 'SEED-%');
  DELETE FROM public.romaneio_itens WHERE romaneio_id IN (SELECT id FROM public.romaneios WHERE numero LIKE 'SEED-%');
  DELETE FROM public.romaneios WHERE numero LIKE 'SEED-%';
  DELETE FROM public.expedicao_itens_lote WHERE expedicao_id IN (SELECT id FROM public.op_expedicoes WHERE observacao LIKE 'SEED-%');
  DELETE FROM public.op_expedicoes WHERE observacao LIKE 'SEED-%' OR op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.contas_receber WHERE nota_fiscal_id IN (SELECT id FROM public.notas_fiscais WHERE is_teste_e2e = true OR observacao LIKE '%SEED%');
  GET DIAGNOSTICS v_count = ROW_COUNT; v_removed := v_removed || jsonb_build_object('contas_receber', v_count);
  DELETE FROM public.notas_fiscais_itens WHERE nota_fiscal_id IN (SELECT id FROM public.notas_fiscais WHERE is_teste_e2e = true);
  DELETE FROM public.notas_fiscais WHERE is_teste_e2e = true;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_removed := v_removed || jsonb_build_object('notas_fiscais', v_count);
  DELETE FROM public.op_faturamento WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_entradas_estoque WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_qualidade WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_apontamentos WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_consumos WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_reservas_lote WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_reprocessos WHERE op_pai_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_eventos WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.op_itens WHERE op_id IN (SELECT id FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%');
  DELETE FROM public.ordens_producao WHERE numero_externo LIKE 'SEED-%';
  GET DIAGNOSTICS v_count = ROW_COUNT; v_removed := v_removed || jsonb_build_object('ordens_producao', v_count);
  DELETE FROM public.lotes WHERE numero_lote LIKE 'SEED-%' OR numero_lote LIKE 'Q-SEED-%';
  GET DIAGNOSTICS v_count = ROW_COUNT; v_removed := v_removed || jsonb_build_object('lotes', v_count);
  DELETE FROM public.pedido_itens WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE numero LIKE 'SEED-%');
  DELETE FROM public.pedidos WHERE numero LIKE 'SEED-%';
  GET DIAGNOSTICS v_count = ROW_COUNT; v_removed := v_removed || jsonb_build_object('pedidos', v_count);
  DELETE FROM public.cliente_artigo_historico WHERE cliente_artigo_id IN (
    SELECT id FROM public.cliente_artigo WHERE codigo_cliente LIKE 'SEED-%' OR descricao_comercial LIKE 'SEED %'
  );
  DELETE FROM public.cliente_artigo WHERE codigo_cliente LIKE 'SEED-%' OR descricao_comercial LIKE 'SEED %';

  RETURN v_removed;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_rollback() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_rollback() TO authenticated;

COMMENT ON FUNCTION public.seed_rollback() IS 'Remove todos os registros do dataset SEED E2E. Restrito a desenvolvedor. Uso apenas em DEV/TEST.';
