-- Cliente x Artigo module
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.cliente_artigo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  artigo_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variante_id UUID REFERENCES public.variantes(id) ON DELETE CASCADE,
  codigo_cliente TEXT,
  descricao_comercial TEXT,
  unidade TEXT DEFAULT 'kg',
  preco_negociado NUMERIC(14,4) NOT NULL CHECK (preco_negociado >= 0),
  quantidade_minima NUMERIC(14,3) DEFAULT 0,
  desconto_maximo_pct NUMERIC(6,3) DEFAULT 0 CHECK (desconto_maximo_pct >= 0 AND desconto_maximo_pct <= 100),
  prazo_entrega_dias INTEGER,
  condicao_pagamento TEXT,
  representante_id UUID REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT vigencia_valida CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio)
);

-- Índices para resolução rápida
CREATE INDEX idx_ca_cliente ON public.cliente_artigo(cliente_id) WHERE ativo;
CREATE INDEX idx_ca_cliente_produto ON public.cliente_artigo(cliente_id, produto_id) WHERE ativo AND produto_id IS NOT NULL;
CREATE INDEX idx_ca_cliente_artigo ON public.cliente_artigo(cliente_id, artigo_id) WHERE ativo;

-- Impede duplicidade de vigência sobreposta (mesma chave lógica)
ALTER TABLE public.cliente_artigo ADD CONSTRAINT cliente_artigo_sem_sobreposicao
EXCLUDE USING gist (
  cliente_id WITH =,
  artigo_id WITH =,
  COALESCE(produto_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
  COALESCE(variante_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
  daterange(vigencia_inicio, COALESCE(vigencia_fim, DATE '9999-12-31'), '[]') WITH &&
) WHERE (ativo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_artigo TO authenticated;
GRANT ALL ON public.cliente_artigo TO service_role;
ALTER TABLE public.cliente_artigo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_artigo select autenticado" ON public.cliente_artigo FOR SELECT TO authenticated USING (true);
CREATE POLICY "cliente_artigo write vendas" ON public.cliente_artigo FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['desenvolvedor','gerente','vendedor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['desenvolvedor','gerente','vendedor']::app_role[]));

CREATE TRIGGER trg_ca_updated_at BEFORE UPDATE ON public.cliente_artigo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Histórico
CREATE TABLE public.cliente_artigo_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_artigo_id UUID NOT NULL REFERENCES public.cliente_artigo(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  alterado_por UUID,
  alterado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ca_hist ON public.cliente_artigo_historico(cliente_artigo_id, alterado_em DESC);

GRANT SELECT, INSERT ON public.cliente_artigo_historico TO authenticated;
GRANT ALL ON public.cliente_artigo_historico TO service_role;
ALTER TABLE public.cliente_artigo_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_hist select" ON public.cliente_artigo_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "ca_hist insert" ON public.cliente_artigo_historico FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.on_cliente_artigo_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.preco_negociado IS DISTINCT FROM OLD.preco_negociado THEN
    INSERT INTO public.cliente_artigo_historico(cliente_artigo_id,campo,valor_anterior,valor_novo,alterado_por)
    VALUES (NEW.id,'preco_negociado',OLD.preco_negociado::text,NEW.preco_negociado::text,auth.uid());
  END IF;
  IF NEW.desconto_maximo_pct IS DISTINCT FROM OLD.desconto_maximo_pct THEN
    INSERT INTO public.cliente_artigo_historico(cliente_artigo_id,campo,valor_anterior,valor_novo,alterado_por)
    VALUES (NEW.id,'desconto_maximo_pct',OLD.desconto_maximo_pct::text,NEW.desconto_maximo_pct::text,auth.uid());
  END IF;
  IF NEW.ativo IS DISTINCT FROM OLD.ativo THEN
    INSERT INTO public.cliente_artigo_historico(cliente_artigo_id,campo,valor_anterior,valor_novo,alterado_por)
    VALUES (NEW.id,'ativo',OLD.ativo::text,NEW.ativo::text,auth.uid());
  END IF;
  IF NEW.vigencia_fim IS DISTINCT FROM OLD.vigencia_fim THEN
    INSERT INTO public.cliente_artigo_historico(cliente_artigo_id,campo,valor_anterior,valor_novo,alterado_por)
    VALUES (NEW.id,'vigencia_fim',OLD.vigencia_fim::text,NEW.vigencia_fim::text,auth.uid());
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_ca_historico AFTER UPDATE ON public.cliente_artigo
  FOR EACH ROW EXECUTE FUNCTION public.on_cliente_artigo_change();

-- Função de resolução
CREATE OR REPLACE FUNCTION public.resolver_preco_cliente_artigo(
  _cliente_id UUID, _produto_id UUID DEFAULT NULL, _variante_id UUID DEFAULT NULL,
  _artigo_id UUID DEFAULT NULL, _data DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(regra_id UUID, origem TEXT, preco NUMERIC, desconto_maximo_pct NUMERIC, condicao_pagamento TEXT, prazo_entrega_dias INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_artigo UUID := _artigo_id;
BEGIN
  IF v_artigo IS NULL AND _produto_id IS NOT NULL THEN
    SELECT article_id INTO v_artigo FROM public.products WHERE id = _produto_id;
  END IF;

  -- 1. cliente + produto + variante
  IF _produto_id IS NOT NULL AND _variante_id IS NOT NULL THEN
    RETURN QUERY
    SELECT ca.id, 'cliente_produto_variante'::text, ca.preco_negociado, ca.desconto_maximo_pct, ca.condicao_pagamento, ca.prazo_entrega_dias
    FROM public.cliente_artigo ca
    WHERE ca.cliente_id = _cliente_id AND ca.produto_id = _produto_id AND ca.variante_id = _variante_id
      AND ca.ativo AND ca.vigencia_inicio <= _data AND (ca.vigencia_fim IS NULL OR ca.vigencia_fim >= _data)
    ORDER BY ca.vigencia_inicio DESC LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 2. cliente + produto
  IF _produto_id IS NOT NULL THEN
    RETURN QUERY
    SELECT ca.id, 'cliente_produto'::text, ca.preco_negociado, ca.desconto_maximo_pct, ca.condicao_pagamento, ca.prazo_entrega_dias
    FROM public.cliente_artigo ca
    WHERE ca.cliente_id = _cliente_id AND ca.produto_id = _produto_id AND ca.variante_id IS NULL
      AND ca.ativo AND ca.vigencia_inicio <= _data AND (ca.vigencia_fim IS NULL OR ca.vigencia_fim >= _data)
    ORDER BY ca.vigencia_inicio DESC LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 3. cliente + artigo
  IF v_artigo IS NOT NULL THEN
    RETURN QUERY
    SELECT ca.id, 'cliente_artigo'::text, ca.preco_negociado, ca.desconto_maximo_pct, ca.condicao_pagamento, ca.prazo_entrega_dias
    FROM public.cliente_artigo ca
    WHERE ca.cliente_id = _cliente_id AND ca.artigo_id = v_artigo AND ca.produto_id IS NULL
      AND ca.ativo AND ca.vigencia_inicio <= _data AND (ca.vigencia_fim IS NULL OR ca.vigencia_fim >= _data)
    ORDER BY ca.vigencia_inicio DESC LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  RETURN;
END;$$;

-- Extensão em pedido_itens para rastrear origem do preço
ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS origem_preco TEXT,
  ADD COLUMN IF NOT EXISTS regra_cliente_artigo_id UUID REFERENCES public.cliente_artigo(id) ON DELETE SET NULL;