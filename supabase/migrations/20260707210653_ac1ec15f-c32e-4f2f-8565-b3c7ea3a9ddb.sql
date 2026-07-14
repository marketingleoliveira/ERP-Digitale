
-- ============================================================
-- FASE 7 — SEGURANÇA: Substituir policies permissivas por RBAC
-- ============================================================

-- Função auxiliar: verifica se usuário possui QUALQUER um dos roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = ANY(_roles) OR role = 'desenvolvedor'::public.app_role)
  );
$$;

-- Macro helpers via expressões inline
-- FIN  = ARRAY['financeiro','gerente','admin']::app_role[]
-- PROD = ARRAY['producao','gerente','admin']::app_role[]
-- LOG  = ARRAY['logistica','gerente','admin']::app_role[]
-- VEN  = ARRAY['vendedor','financeiro','gerente','admin']::app_role[]
-- CAD  = ARRAY['gerente','admin']::app_role[]
-- QUA  = ARRAY['qualidade','producao','gerente','admin']::app_role[]
-- EST  = ARRAY['producao','logistica','financeiro','gerente','admin']::app_role[]

-- =============================================================
-- 1. CADASTROS DE PRODUTOS (gerente/admin)
-- =============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['agulhas','composicoes','cores','correias','estampas','fios',
                           'maquinas','tinturarias','variantes','articles','products',
                           'product_variants','article_fios','sales_reps']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth read %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth write %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth update %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth delete %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth insert %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated read %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated insert %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated update %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated delete %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s select auth" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "products select auth" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "variants select auth" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "articles select auth" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "article_fios select auth" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "sales_reps select auth" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Autenticados podem ver %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Autenticados podem inserir %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Autenticados podem atualizar %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Autenticados podem excluir %1$s" ON public.%1$s', t);

    EXECUTE format('CREATE POLICY "%1$s_read_auth" ON public.%1$s FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write_gerente" ON public.%1$s FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[]))$f$, t);
  END LOOP;
END $$;

-- =============================================================
-- 2. FINANCEIRO (financeiro/gerente/admin) — leitura restrita
-- =============================================================
DROP POLICY IF EXISTS "cp_auth_all" ON public.contas_pagar;
DROP POLICY IF EXISTS "cr_read" ON public.contas_receber;
DROP POLICY IF EXISTS "mf_read" ON public.movimentos_financeiros;
DROP POLICY IF EXISTS "cb_read" ON public.contas_bancarias;
DROP POLICY IF EXISTS "cc_read" ON public.centros_custo;
DROP POLICY IF EXISTS "com_read" ON public.comissoes;

CREATE POLICY "contas_pagar_read_fin" ON public.contas_pagar FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "contas_pagar_write_fin" ON public.contas_pagar FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));

CREATE POLICY "contas_receber_read_fin" ON public.contas_receber FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "contas_receber_write_fin" ON public.contas_receber FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));

CREATE POLICY "mf_read_fin" ON public.movimentos_financeiros FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "mf_write_fin" ON public.movimentos_financeiros FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));

CREATE POLICY "cb_read_fin" ON public.contas_bancarias FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "cb_write_fin" ON public.contas_bancarias FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));

CREATE POLICY "cc_read_fin" ON public.centros_custo FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "cc_write_fin" ON public.centros_custo FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));

CREATE POLICY "com_read_fin" ON public.comissoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "com_write_fin" ON public.comissoes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]));

-- =============================================================
-- 3. COMPRAS (financeiro/gerente/admin)
-- =============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['fornecedores','cotacoes','cotacao_itens','cotacao_fornecedores',
                           'pedidos_compra','pedidos_compra_itens','recebimentos','recebimento_itens',
                           'solicitacoes_compra','solicitacoes_compra_itens']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "fornecedores_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "cot_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "ci_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "cf_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "pc_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "pci_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "rec_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "ri_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "sc_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "sci_auth_all" ON public.%1$s', t);

    EXECUTE format('CREATE POLICY "%1$s_read_auth" ON public.%1$s FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write_fin" ON public.%1$s FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))$f$, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "ce_auth_read" ON public.compras_eventos;
DROP POLICY IF EXISTS "ce_auth_insert" ON public.compras_eventos;
CREATE POLICY "ce_read_auth" ON public.compras_eventos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "ce_insert_fin" ON public.compras_eventos FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','producao','gerente','admin']::public.app_role[]));

-- =============================================================
-- 4. PRODUÇÃO / OPs (producao/gerente/admin)
-- =============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['op_apontamentos','op_consumos','op_entradas_estoque',
                           'op_expedicoes','op_faturamento','op_itens','op_qualidade','lotes']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "op_apontamentos_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "op_consumos_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "op_entradas_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "op_expedicoes_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "op_faturamento_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "op_itens_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "op_qualidade_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth read lotes" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth insert lotes" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth update lotes" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth delete lotes" ON public.%1$s', t);

    EXECUTE format('CREATE POLICY "%1$s_read_auth" ON public.%1$s FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write_prod" ON public.%1$s FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['producao','logistica','gerente','admin']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','logistica','gerente','admin']::public.app_role[]))$f$, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "op_read" ON public.ordens_producao;
DROP POLICY IF EXISTS "op_insert" ON public.ordens_producao;
DROP POLICY IF EXISTS "op_update" ON public.ordens_producao;
CREATE POLICY "op_read_auth" ON public.ordens_producao FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "op_insert_prod" ON public.ordens_producao FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','vendedor','gerente','admin']::public.app_role[]));
CREATE POLICY "op_update_prod" ON public.ordens_producao FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['producao','gerente','admin']::public.app_role[]));

DROP POLICY IF EXISTS "op_eventos_read" ON public.op_eventos;
DROP POLICY IF EXISTS "op_eventos_insert" ON public.op_eventos;
CREATE POLICY "op_eventos_read_auth" ON public.op_eventos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "op_eventos_insert_prod" ON public.op_eventos FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','qualidade','gerente','admin']::public.app_role[]));

-- =============================================================
-- 5. ESTOQUE / KARDEX
-- =============================================================
DROP POLICY IF EXISTS "kardex_read" ON public.estoque_movimentos;
DROP POLICY IF EXISTS "kardex_insert" ON public.estoque_movimentos;
CREATE POLICY "kardex_read_auth" ON public.estoque_movimentos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "kardex_insert_op" ON public.estoque_movimentos FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['producao','logistica','financeiro','gerente','admin']::public.app_role[]));

-- =============================================================
-- 6. VENDAS / PEDIDOS / NF
-- =============================================================
DROP POLICY IF EXISTS "pedidos_read" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_write" ON public.pedidos;
CREATE POLICY "pedidos_read_auth" ON public.pedidos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "pedidos_write_ven" ON public.pedidos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[]));

DROP POLICY IF EXISTS "pedido_itens_all" ON public.pedido_itens;
CREATE POLICY "pedido_itens_read_auth" ON public.pedido_itens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "pedido_itens_write_ven" ON public.pedido_itens FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[]));

DROP POLICY IF EXISTS "customers select auth" ON public.customers;
CREATE POLICY "customers_read_auth" ON public.customers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['notas_fiscais','notas_fiscais_itens','notas_fiscais_faturas']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "notas_fiscais_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "nf_itens_auth_all" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "nf_faturas_auth_all" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "%1$s_read_auth" ON public.%1$s FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write_fin" ON public.%1$s FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[]))$f$, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Autenticados leem eventos" ON public.nfe_eventos;
DROP POLICY IF EXISTS "Autenticados leem logs" ON public.nfe_logs;
DROP POLICY IF EXISTS "Autenticados inserem logs" ON public.nfe_logs;
DROP POLICY IF EXISTS "Autenticados leem sequencias" ON public.nfe_sequencias;
CREATE POLICY "nfe_eventos_read_auth" ON public.nfe_eventos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "nfe_logs_read_auth" ON public.nfe_logs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "nfe_logs_insert_fin" ON public.nfe_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['vendedor','financeiro','gerente','admin']::public.app_role[]));
CREATE POLICY "nfe_seq_read_auth" ON public.nfe_sequencias FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================================
-- 7. LOGÍSTICA
-- =============================================================
DROP POLICY IF EXISTS "rom_read" ON public.romaneios;
DROP POLICY IF EXISTS "romi_read" ON public.romaneio_itens;
DROP POLICY IF EXISTS "sep_read" ON public.separacoes;
DROP POLICY IF EXISTS "sepi_read" ON public.separacao_itens;
DROP POLICY IF EXISTS "tr_read" ON public.transportadoras;
DROP POLICY IF EXISTS "ee_read" ON public.entrega_eventos;

CREATE POLICY "rom_read_auth" ON public.romaneios FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "rom_write_log" ON public.romaneios FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]));
CREATE POLICY "romi_read_auth" ON public.romaneio_itens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "romi_write_log" ON public.romaneio_itens FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]));
CREATE POLICY "sep_read_auth" ON public.separacoes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "sep_write_log" ON public.separacoes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['logistica','producao','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['logistica','producao','gerente','admin']::public.app_role[]));
CREATE POLICY "sepi_read_auth" ON public.separacao_itens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "sepi_write_log" ON public.separacao_itens FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['logistica','producao','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['logistica','producao','gerente','admin']::public.app_role[]));
CREATE POLICY "tr_read_auth" ON public.transportadoras FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "tr_write_log" ON public.transportadoras FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]));
CREATE POLICY "ee_read_auth" ON public.entrega_eventos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "ee_write_log" ON public.entrega_eventos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['logistica','gerente','admin']::public.app_role[]));

-- =============================================================
-- 8. TABELAS FISCAIS (leitura autenticada; escrita fin/gerente/admin)
-- =============================================================
DROP POLICY IF EXISTS "cfop_auth_all" ON public.cfop;
DROP POLICY IF EXISTS "impostos_auth_all" ON public.impostos;
DROP POLICY IF EXISTS "uf_icms_auth_all" ON public.uf_icms;
DROP POLICY IF EXISTS "read ncm" ON public.ncm_catalogo;
DROP POLICY IF EXISTS "read regras" ON public.regras_tributarias;
DROP POLICY IF EXISTS "read beneficios" ON public.beneficios_fiscais;
DROP POLICY IF EXISTS "Authenticated read uf_aliquotas" ON public.uf_aliquotas;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cfop','impostos','uf_icms','ncm_catalogo','regras_tributarias','beneficios_fiscais','uf_aliquotas']
  LOOP
    EXECUTE format('CREATE POLICY "%1$s_read_auth" ON public.%1$s FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write_fin" ON public.%1$s FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['financeiro','gerente','admin']::public.app_role[]))$f$, t);
  END LOOP;
END $$;

-- =============================================================
-- 9. RH / EMPRESA / CARGOS (gerente/admin) — leitura restrita
-- =============================================================
DROP POLICY IF EXISTS "funcionarios_select_auth" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert_auth" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_update_auth" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_delete_auth" ON public.funcionarios;
CREATE POLICY "funcionarios_read_ger" ON public.funcionarios FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[]));
CREATE POLICY "funcionarios_write_ger" ON public.funcionarios FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[]));

DROP POLICY IF EXISTS "Autenticados leem empresa" ON public.empresa;
DROP POLICY IF EXISTS "Autenticados leem filiais" ON public.empresa_filiais;
CREATE POLICY "empresa_read_ger" ON public.empresa FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente','admin','financeiro']::public.app_role[]));
CREATE POLICY "filiais_read_ger" ON public.empresa_filiais FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente','admin','financeiro']::public.app_role[]));

DROP POLICY IF EXISTS "cargos_select_authenticated" ON public.cargos;
CREATE POLICY "cargos_read_auth" ON public.cargos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================================
-- 10. AUDITORIA / EVENTOS / PROFILES
-- =============================================================
DROP POLICY IF EXISTS "audit_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_read_ger" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[]));
CREATE POLICY "audit_insert_auth" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "profiles select all auth" ON public.profiles;
CREATE POLICY "profiles_read_self_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['gerente','admin']::public.app_role[]));
