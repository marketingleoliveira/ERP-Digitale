-- Corrigir semântica: lotes.fornecedor_id deve apontar para fornecedores; adicionar tinturaria_id opcional.
-- Auditoria prévia: 1 lote existente, 0 com fornecedor_id preenchido — sem dados ambíguos a separar.

ALTER TABLE public.lotes DROP CONSTRAINT IF EXISTS lotes_fornecedor_id_fkey;

ALTER TABLE public.lotes
  ADD CONSTRAINT lotes_fornecedor_id_fkey
  FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL;

ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS tinturaria_id UUID REFERENCES public.tinturarias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lotes_tinturaria ON public.lotes(tinturaria_id);