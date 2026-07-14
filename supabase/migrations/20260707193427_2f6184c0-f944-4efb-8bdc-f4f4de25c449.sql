
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
      SELECT p.vendedor_id, COALESCE(sr.comissao_pct, 0)
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
