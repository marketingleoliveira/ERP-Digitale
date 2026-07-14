
-- Etapa 4: Automações internas — auditoria de autorização e baixa de estoque

-- Função que baixa estoque quando NF é autorizada (por variante_id → lotes.item_id/tipo='variante')
CREATE OR REPLACE FUNCTION public.baixar_estoque_nf(_nota_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it RECORD;
  restante NUMERIC;
  lote RECORD;
  consumir NUMERIC;
  total_baixado INTEGER := 0;
BEGIN
  FOR it IN
    SELECT id, variante_id, quantidade FROM public.notas_fiscais_itens
    WHERE nota_fiscal_id = _nota_id AND variante_id IS NOT NULL AND COALESCE(quantidade,0) > 0
  LOOP
    restante := it.quantidade;
    FOR lote IN
      SELECT id, quantidade_disponivel FROM public.lotes
      WHERE item_id = it.variante_id AND habilitado = true AND COALESCE(quantidade_disponivel,0) > 0
      ORDER BY data_entrada ASC, created_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN restante <= 0;
      consumir := LEAST(lote.quantidade_disponivel, restante);
      UPDATE public.lotes SET quantidade_disponivel = quantidade_disponivel - consumir, updated_at = now() WHERE id = lote.id;
      restante := restante - consumir;
      total_baixado := total_baixado + 1;
    END LOOP;
  END LOOP;
  RETURN total_baixado;
END;
$$;

-- Trigger: quando status_sefaz muda para 'autorizada' → baixa estoque + log
CREATE OR REPLACE FUNCTION public.on_nfe_autorizada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  baixados INTEGER;
BEGIN
  IF NEW.status_sefaz = 'autorizada' AND COALESCE(OLD.status_sefaz,'') <> 'autorizada' AND NEW.tipo = 'saida' THEN
    baixados := public.baixar_estoque_nf(NEW.id);
    INSERT INTO public.nfe_logs (nota_fiscal_id, acao, response, http_status)
    VALUES (NEW.id, 'baixa_estoque', jsonb_build_object('lotes_afetados', baixados), 200);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nfe_autorizada ON public.notas_fiscais;
CREATE TRIGGER trg_nfe_autorizada
AFTER UPDATE OF status_sefaz ON public.notas_fiscais
FOR EACH ROW EXECUTE FUNCTION public.on_nfe_autorizada();
