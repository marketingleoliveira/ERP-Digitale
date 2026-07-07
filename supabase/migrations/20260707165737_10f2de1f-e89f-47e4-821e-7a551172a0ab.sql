
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS funcionarios_cargo_id_idx ON public.funcionarios (cargo_id);

-- Backfill: liga pelos nomes existentes em "tipo"
UPDATE public.funcionarios f
SET cargo_id = c.id
FROM public.cargos c
WHERE f.cargo_id IS NULL
  AND f.tipo IS NOT NULL
  AND lower(trim(f.tipo)) = lower(trim(c.nome));
