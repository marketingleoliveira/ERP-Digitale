
-- Contas a Receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  op_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  descricao TEXT,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(14,2) NOT NULL DEFAULT 0,
  vencimento DATE,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','pago','parcial','cancelado')),
  parcela INTEGER NOT NULL DEFAULT 1,
  total_parcelas INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contas_receber_nf_idx ON public.contas_receber(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS contas_receber_status_idx ON public.contas_receber(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_receber TO authenticated;
GRANT ALL ON public.contas_receber TO service_role;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_read" ON public.contas_receber FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_write" ON public.contas_receber FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_cr_updated BEFORE UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comissões
CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  base_calculo NUMERIC(14,2) NOT NULL DEFAULT 0,
  percentual NUMERIC(6,3) NOT NULL DEFAULT 0,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','paga','cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comissoes_nf_idx ON public.comissoes(nota_fiscal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comissoes TO authenticated;
GRANT ALL ON public.comissoes TO service_role;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "com_read" ON public.comissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "com_write" ON public.comissoes FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_com_updated BEFORE UPDATE ON public.comissoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit logs (genérico)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade TEXT NOT NULL,
  entidade_id UUID,
  acao TEXT NOT NULL,
  de_status TEXT,
  para_status TEXT,
  payload JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_ent_idx ON public.audit_logs(entidade, entidade_id);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Motor Financeiro: ao autorizar NF-e, gerar Contas a Receber + Comissão
CREATE OR REPLACE FUNCTION public.on_nfe_autorizada_financeiro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendedor UUID;
  v_perc NUMERIC(6,3);
BEGIN
  IF NEW.status_sefaz = 'autorizada'
     AND COALESCE(OLD.status_sefaz,'') <> 'autorizada'
     AND NEW.tipo = 'saida'
     AND NEW.cliente_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.contas_receber WHERE nota_fiscal_id = NEW.id) THEN

    INSERT INTO public.contas_receber(nota_fiscal_id, op_id, cliente_id, descricao, valor, vencimento, parcela, total_parcelas)
    VALUES (NEW.id, NEW.op_id, NEW.cliente_id,
            'NF-e ' || NEW.numero || '/' || NEW.serie,
            NEW.valor_total, NEW.data_emissao + INTERVAL '30 days', 1, 1);

    IF NEW.op_id IS NOT NULL THEN
      SELECT p.vendedor_id, COALESCE(sr.commission_percent, 0)
        INTO v_vendedor, v_perc
      FROM public.ordens_producao o
      JOIN public.pedidos p ON p.id = o.pedido_id
      LEFT JOIN public.sales_reps sr ON sr.id = p.vendedor_id
      WHERE o.id = NEW.op_id;

      IF v_vendedor IS NOT NULL AND v_perc > 0 THEN
        INSERT INTO public.comissoes(nota_fiscal_id, vendedor_id, base_calculo, percentual, valor)
        VALUES (NEW.id, v_vendedor, NEW.valor_total, v_perc,
                ROUND(NEW.valor_total * v_perc / 100.0, 2));
      END IF;
    END IF;

    INSERT INTO public.audit_logs(entidade, entidade_id, acao, para_status, payload)
    VALUES ('nota_fiscal', NEW.id, 'financeiro_gerado', 'autorizada',
            jsonb_build_object('valor', NEW.valor_total, 'op_id', NEW.op_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_autorizada_financeiro ON public.notas_fiscais;
CREATE TRIGGER trg_nfe_autorizada_financeiro
AFTER UPDATE OF status_sefaz ON public.notas_fiscais
FOR EACH ROW EXECUTE FUNCTION public.on_nfe_autorizada_financeiro();
