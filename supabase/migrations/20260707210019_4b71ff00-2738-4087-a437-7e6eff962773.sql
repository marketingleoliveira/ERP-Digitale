
CREATE SEQUENCE IF NOT EXISTS public.seq_romaneio_numero START 1;

-- TRANSPORTADORAS
CREATE TABLE public.transportadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT UNIQUE,
  ie TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  antt TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transportadoras TO authenticated;
GRANT ALL ON public.transportadoras TO service_role;
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY tr_read ON public.transportadoras FOR SELECT TO authenticated USING (true);
CREATE POLICY tr_write ON public.transportadoras FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_tr_upd BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEPARAÇÕES
CREATE TABLE public.separacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_separacao','separada','conferida','divergente','cancelada')),
  responsavel_id UUID,
  conferente_id UUID,
  iniciada_em TIMESTAMPTZ,
  finalizada_em TIMESTAMPTZ,
  conferida_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sep_op_idx ON public.separacoes(op_id);
CREATE INDEX sep_ped_idx ON public.separacoes(pedido_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.separacoes TO authenticated;
GRANT ALL ON public.separacoes TO service_role;
ALTER TABLE public.separacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY sep_read ON public.separacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY sep_write ON public.separacoes FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_sep_upd BEFORE UPDATE ON public.separacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.separacao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  separacao_id UUID NOT NULL REFERENCES public.separacoes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  item_tipo TEXT,
  item_id UUID,
  lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
  qtd_solicitada NUMERIC(14,3) NOT NULL DEFAULT 0,
  qtd_separada NUMERIC(14,3) NOT NULL DEFAULT 0,
  qtd_conferida NUMERIC(14,3) NOT NULL DEFAULT 0,
  divergencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sepi_sep_idx ON public.separacao_itens(separacao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.separacao_itens TO authenticated;
GRANT ALL ON public.separacao_itens TO service_role;
ALTER TABLE public.separacao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY sepi_read ON public.separacao_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY sepi_write ON public.separacao_itens FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_sepi_upd BEFORE UPDATE ON public.separacao_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ROMANEIOS
CREATE TABLE public.romaneios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE DEFAULT nextval('public.seq_romaneio_numero'),
  transportadora_id UUID REFERENCES public.transportadoras(id),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_saida TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  motorista TEXT,
  veiculo_placa TEXT,
  veiculo_descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado','em_transito','entregue','devolvido','cancelado')),
  valor_frete NUMERIC(14,2) NOT NULL DEFAULT 0,
  peso_total NUMERIC(14,3) NOT NULL DEFAULT 0,
  volumes_total INTEGER NOT NULL DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rom_status_idx ON public.romaneios(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.romaneios TO authenticated;
GRANT ALL ON public.romaneios TO service_role;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;
CREATE POLICY rom_read ON public.romaneios FOR SELECT TO authenticated USING (true);
CREATE POLICY rom_write ON public.romaneios FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_rom_upd BEFORE UPDATE ON public.romaneios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.romaneio_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id UUID NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  op_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  separacao_id UUID REFERENCES public.separacoes(id) ON DELETE SET NULL,
  volumes INTEGER NOT NULL DEFAULT 1,
  peso NUMERIC(14,3) NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX romi_rom_idx ON public.romaneio_itens(romaneio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.romaneio_itens TO authenticated;
GRANT ALL ON public.romaneio_itens TO service_role;
ALTER TABLE public.romaneio_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY romi_read ON public.romaneio_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY romi_write ON public.romaneio_itens FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));
CREATE TRIGGER trg_romi_upd BEFORE UPDATE ON public.romaneio_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ENTREGA / RASTREAMENTO
CREATE TABLE public.entrega_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id UUID REFERENCES public.romaneios(id) ON DELETE CASCADE,
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  evento TEXT NOT NULL,
  local TEXT,
  descricao TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ee_rom_idx ON public.entrega_eventos(romaneio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrega_eventos TO authenticated;
GRANT ALL ON public.entrega_eventos TO service_role;
ALTER TABLE public.entrega_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY ee_read ON public.entrega_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY ee_write ON public.entrega_eventos FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid())) WITH CHECK (public.is_admin_or_gerente(auth.uid()));

-- FUNÇÃO: transição de romaneio + atualização de expedições
CREATE OR REPLACE FUNCTION public.romaneio_transicionar(_romaneio_id UUID, _novo_status TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  atual TEXT;
  novo_exp_status TEXT;
BEGIN
  SELECT status INTO atual FROM public.romaneios WHERE id = _romaneio_id FOR UPDATE;
  IF atual IS NULL THEN RAISE EXCEPTION 'Romaneio % não encontrado', _romaneio_id; END IF;
  IF atual = _novo_status THEN RETURN atual; END IF;

  UPDATE public.romaneios
     SET status = _novo_status,
         data_saida = CASE WHEN _novo_status = 'em_transito' AND data_saida IS NULL THEN now() ELSE data_saida END,
         data_entrega = CASE WHEN _novo_status = 'entregue' THEN now() ELSE data_entrega END,
         updated_at = now()
   WHERE id = _romaneio_id;

  novo_exp_status := CASE
    WHEN _novo_status = 'em_transito' THEN 'saiu'
    WHEN _novo_status = 'entregue' THEN 'entregue'
    WHEN _novo_status = 'devolvido' THEN 'devolvido'
    ELSE NULL
  END;

  IF novo_exp_status IS NOT NULL THEN
    UPDATE public.op_expedicoes SET status = novo_exp_status,
      data_saida = CASE WHEN novo_exp_status = 'saiu' AND data_saida IS NULL THEN now() ELSE data_saida END,
      data_entrega = CASE WHEN novo_exp_status = 'entregue' THEN now() ELSE data_entrega END
    WHERE op_id IN (SELECT op_id FROM public.romaneio_itens WHERE romaneio_id = _romaneio_id AND op_id IS NOT NULL);
  END IF;

  INSERT INTO public.entrega_eventos(romaneio_id, evento, descricao, user_id)
  VALUES (_romaneio_id, _novo_status, 'Transição ' || atual || ' → ' || _novo_status, auth.uid());

  RETURN _novo_status;
END; $$;
