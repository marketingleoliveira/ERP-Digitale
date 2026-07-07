
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS flag_cliente boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS flag_fiador boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_malha boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_acabamento boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_confeccao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_importador boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_fornecedor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_transportadora boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_representante boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_habilitado boolean NOT NULL DEFAULT true;
