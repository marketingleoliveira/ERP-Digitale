
CREATE TABLE public.lotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('tecido','fio')),
  item_id UUID NOT NULL,
  numero_lote TEXT NOT NULL,
  quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
  quantidade_disponivel NUMERIC(14,4) NOT NULL DEFAULT 0,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  fornecedor_id UUID REFERENCES public.tinturarias(id) ON DELETE SET NULL,
  observacao TEXT,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo, item_id, numero_lote)
);
CREATE INDEX idx_lotes_item ON public.lotes(tipo, item_id);
CREATE INDEX idx_lotes_fornecedor ON public.lotes(fornecedor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lotes TO authenticated;
GRANT ALL ON public.lotes TO service_role;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read lotes" ON public.lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert lotes" ON public.lotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update lotes" ON public.lotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete lotes" ON public.lotes FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_lotes_updated BEFORE UPDATE ON public.lotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
