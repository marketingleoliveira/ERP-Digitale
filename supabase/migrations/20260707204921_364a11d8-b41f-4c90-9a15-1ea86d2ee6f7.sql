
-- ============ SEQUENCES ============
CREATE SEQUENCE IF NOT EXISTS public.seq_solicitacao_compra_numero START 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_pedido_compra_numero START 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_recebimento_numero START 1;

-- ============ FORNECEDORES ============
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  inscricao_estadual TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  condicao_pagamento_padrao TEXT,
  prazo_entrega_dias INTEGER DEFAULT 0,
  observacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_auth_all" ON public.fornecedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_fornecedores_upd BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SOLICITAÇÕES DE COMPRA ============
CREATE TABLE public.solicitacoes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.seq_solicitacao_compra_numero'),
  solicitante_id UUID REFERENCES auth.users(id),
  setor TEXT,
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa','normal','alta','urgente')),
  justificativa TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aprovada','cotando','atendida','cancelada')),
  aprovador_id UUID REFERENCES auth.users(id),
  aprovada_em TIMESTAMPTZ,
  necessidade_em DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_compra TO authenticated;
GRANT ALL ON public.solicitacoes_compra TO service_role;
ALTER TABLE public.solicitacoes_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_auth_all" ON public.solicitacoes_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sc_upd BEFORE UPDATE ON public.solicitacoes_compra FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.solicitacoes_compra_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_compra(id) ON DELETE CASCADE,
  tipo_ref TEXT CHECK (tipo_ref IN ('produto','variante','fio','outro')),
  ref_id UUID,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL CHECK (quantidade > 0),
  unidade TEXT NOT NULL DEFAULT 'un',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.solicitacoes_compra_itens(solicitacao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_compra_itens TO authenticated;
GRANT ALL ON public.solicitacoes_compra_itens TO service_role;
ALTER TABLE public.solicitacoes_compra_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sci_auth_all" ON public.solicitacoes_compra_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sci_upd BEFORE UPDATE ON public.solicitacoes_compra_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COTAÇÕES ============
CREATE TABLE public.cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID REFERENCES public.solicitacoes_compra(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','respondida','escolhida','cancelada')),
  prazo_resposta DATE,
  escolhida_fornecedor_id UUID REFERENCES public.fornecedores(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT ALL ON public.cotacoes TO service_role;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cot_auth_all" ON public.cotacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cot_upd BEFORE UPDATE ON public.cotacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cotacao_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id UUID NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  condicao_pagamento TEXT,
  prazo_entrega_dias INTEGER,
  frete NUMERIC(14,2) DEFAULT 0,
  desconto NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) DEFAULT 0,
  respondida_em TIMESTAMPTZ,
  escolhida BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cotacao_id, fornecedor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacao_fornecedores TO authenticated;
GRANT ALL ON public.cotacao_fornecedores TO service_role;
ALTER TABLE public.cotacao_fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf_auth_all" ON public.cotacao_fornecedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cf_upd BEFORE UPDATE ON public.cotacao_fornecedores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cotacao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_fornecedor_id UUID NOT NULL REFERENCES public.cotacao_fornecedores(id) ON DELETE CASCADE,
  solicitacao_item_id UUID REFERENCES public.solicitacoes_compra_itens(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
  ipi NUMERIC(6,3) DEFAULT 0,
  icms NUMERIC(6,3) DEFAULT 0,
  subtotal NUMERIC(14,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.cotacao_itens(cotacao_fornecedor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacao_itens TO authenticated;
GRANT ALL ON public.cotacao_itens TO service_role;
ALTER TABLE public.cotacao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ci_auth_all" ON public.cotacao_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_ci_upd BEFORE UPDATE ON public.cotacao_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PEDIDOS DE COMPRA ============
CREATE TABLE public.pedidos_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.seq_pedido_compra_numero'),
  cotacao_id UUID REFERENCES public.cotacoes(id),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  condicao_pagamento TEXT,
  prazo_entrega DATE,
  frete NUMERIC(14,2) DEFAULT 0,
  desconto NUMERIC(14,2) DEFAULT 0,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado','confirmado','parcial','recebido','cancelado')),
  enviado_em TIMESTAMPTZ,
  confirmado_em TIMESTAMPTZ,
  observacao TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_compra TO authenticated;
GRANT ALL ON public.pedidos_compra TO service_role;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_auth_all" ON public.pedidos_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pc_upd BEFORE UPDATE ON public.pedidos_compra FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pedidos_compra_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
  tipo_ref TEXT CHECK (tipo_ref IN ('produto','variante','fio','outro')),
  ref_id UUID,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL CHECK (quantidade > 0),
  quantidade_recebida NUMERIC(14,3) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
  ncm TEXT,
  cfop TEXT,
  subtotal NUMERIC(14,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.pedidos_compra_itens(pedido_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_compra_itens TO authenticated;
GRANT ALL ON public.pedidos_compra_itens TO service_role;
ALTER TABLE public.pedidos_compra_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pci_auth_all" ON public.pedidos_compra_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pci_upd BEFORE UPDATE ON public.pedidos_compra_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RECEBIMENTOS ============
CREATE TABLE public.recebimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.seq_recebimento_numero'),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id),
  nota_fornecedor TEXT,
  chave_nfe TEXT,
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  transportadora TEXT,
  valor_nota NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido','em_conferencia','conferido','divergente','estornado')),
  recebedor_id UUID REFERENCES auth.users(id),
  conferido_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recebimentos TO authenticated;
GRANT ALL ON public.recebimentos TO service_role;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rec_auth_all" ON public.recebimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_rec_upd BEFORE UPDATE ON public.recebimentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recebimento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recebimento_id UUID NOT NULL REFERENCES public.recebimentos(id) ON DELETE CASCADE,
  pedido_item_id UUID NOT NULL REFERENCES public.pedidos_compra_itens(id),
  quantidade_recebida NUMERIC(14,3) NOT NULL DEFAULT 0,
  quantidade_aprovada NUMERIC(14,3) NOT NULL DEFAULT 0,
  quantidade_rejeitada NUMERIC(14,3) NOT NULL DEFAULT 0,
  motivo_divergencia TEXT,
  lote_fornecedor TEXT,
  lote_id UUID REFERENCES public.lotes(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.recebimento_itens(recebimento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recebimento_itens TO authenticated;
GRANT ALL ON public.recebimento_itens TO service_role;
ALTER TABLE public.recebimento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ri_auth_all" ON public.recebimento_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_ri_upd BEFORE UPDATE ON public.recebimento_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CONTAS A PAGAR ============
CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos_compra(id),
  recebimento_id UUID REFERENCES public.recebimentos(id),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  descricao TEXT NOT NULL,
  parcela INTEGER NOT NULL DEFAULT 1,
  total_parcelas INTEGER NOT NULL DEFAULT 1,
  valor NUMERIC(14,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','paga','vencida','cancelada')),
  pago_em TIMESTAMPTZ,
  valor_pago NUMERIC(14,2),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.contas_pagar(fornecedor_id);
CREATE INDEX ON public.contas_pagar(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_pagar TO authenticated;
GRANT ALL ON public.contas_pagar TO service_role;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_auth_all" ON public.contas_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cp_upd BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EVENTOS (rastreabilidade) ============
CREATE TABLE public.compras_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  acao TEXT NOT NULL,
  de_status TEXT,
  para_status TEXT,
  payload JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.compras_eventos(entidade, entidade_id);
GRANT SELECT, INSERT ON public.compras_eventos TO authenticated;
GRANT ALL ON public.compras_eventos TO service_role;
ALTER TABLE public.compras_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ce_auth_read" ON public.compras_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ce_auth_insert" ON public.compras_eventos FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGERS DE NEGÓCIO ============

-- Ao conferir recebimento: cria lotes, atualiza pedido, gera contas a pagar
CREATE OR REPLACE FUNCTION public.on_recebimento_conferido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ri RECORD;
  pi RECORD;
  ped RECORD;
  novo_lote_id UUID;
  qtd_pendente NUMERIC;
  n_parcelas INTEGER;
  valor_parcela NUMERIC;
  i INTEGER;
BEGIN
  IF NEW.status = 'conferido' AND COALESCE(OLD.status,'') <> 'conferido' THEN
    -- cria lotes e atualiza quantidade_recebida
    FOR ri IN SELECT * FROM public.recebimento_itens WHERE recebimento_id = NEW.id
    LOOP
      SELECT * INTO pi FROM public.pedidos_compra_itens WHERE id = ri.pedido_item_id;
      IF ri.quantidade_aprovada > 0 AND pi.ref_id IS NOT NULL AND pi.tipo_ref IN ('produto','variante','fio') THEN
        INSERT INTO public.lotes (tipo, item_id, numero_lote, quantidade, quantidade_disponivel, data_entrada, fornecedor_id, habilitado, observacao)
        VALUES (pi.tipo_ref, pi.ref_id,
                COALESCE(ri.lote_fornecedor, 'REC-' || NEW.numero || '-' || substr(ri.id::text,1,6)),
                ri.quantidade_aprovada, ri.quantidade_aprovada, NEW.data_recebimento,
                (SELECT fornecedor_id FROM public.pedidos_compra WHERE id = pi.pedido_id),
                true, 'Recebimento #' || NEW.numero)
        RETURNING id INTO novo_lote_id;
        UPDATE public.recebimento_itens SET lote_id = novo_lote_id WHERE id = ri.id;
      END IF;
      UPDATE public.pedidos_compra_itens
        SET quantidade_recebida = COALESCE(quantidade_recebida,0) + ri.quantidade_aprovada
        WHERE id = ri.pedido_item_id;
    END LOOP;

    -- atualiza status do pedido
    SELECT * INTO ped FROM public.pedidos_compra WHERE id = NEW.pedido_id;
    SELECT SUM(quantidade - COALESCE(quantidade_recebida,0)) INTO qtd_pendente
      FROM public.pedidos_compra_itens WHERE pedido_id = ped.id;
    IF qtd_pendente <= 0 THEN
      UPDATE public.pedidos_compra SET status = 'recebido' WHERE id = ped.id;
    ELSE
      UPDATE public.pedidos_compra SET status = 'parcial' WHERE id = ped.id;
    END IF;

    -- gera contas a pagar se ainda não existe para este recebimento
    IF NOT EXISTS (SELECT 1 FROM public.contas_pagar WHERE recebimento_id = NEW.id) THEN
      n_parcelas := GREATEST(1, COALESCE((regexp_match(COALESCE(ped.condicao_pagamento,''), '(\d+)x'))[1]::int, 1));
      valor_parcela := ROUND(COALESCE(NEW.valor_nota, ped.valor_total, 0) / n_parcelas, 2);
      FOR i IN 1..n_parcelas LOOP
        INSERT INTO public.contas_pagar (pedido_id, recebimento_id, fornecedor_id, descricao, parcela, total_parcelas, valor, vencimento)
        VALUES (ped.id, NEW.id, ped.fornecedor_id,
                'PC ' || ped.numero || ' / Rec ' || NEW.numero,
                i, n_parcelas, valor_parcela,
                NEW.data_recebimento + (i * 30));
      END LOOP;
    END IF;

    INSERT INTO public.compras_eventos(entidade, entidade_id, acao, de_status, para_status, user_id, payload)
    VALUES ('recebimento', NEW.id, 'conferido', OLD.status, NEW.status, auth.uid(),
            jsonb_build_object('pedido_id', NEW.pedido_id));

    NEW.conferido_em := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recebimento_conferido
  BEFORE UPDATE ON public.recebimentos
  FOR EACH ROW EXECUTE FUNCTION public.on_recebimento_conferido();

-- Auditoria genérica de mudança de status
CREATE OR REPLACE FUNCTION public.log_compras_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.compras_eventos(entidade, entidade_id, acao, de_status, para_status, user_id)
    VALUES (TG_ARGV[0], NEW.id, 'status_change', OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sc_status AFTER UPDATE ON public.solicitacoes_compra
  FOR EACH ROW EXECUTE FUNCTION public.log_compras_status('solicitacao_compra');
CREATE TRIGGER trg_cot_status AFTER UPDATE ON public.cotacoes
  FOR EACH ROW EXECUTE FUNCTION public.log_compras_status('cotacao');
CREATE TRIGGER trg_pc_status AFTER UPDATE ON public.pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION public.log_compras_status('pedido_compra');
