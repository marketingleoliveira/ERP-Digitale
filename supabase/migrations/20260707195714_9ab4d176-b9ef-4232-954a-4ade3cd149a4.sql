
CREATE TABLE IF NOT EXISTS public.certificados_digitais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresa(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text NOT NULL,
  pfx_storage_path text NOT NULL,
  senha_cifrada text NOT NULL,
  senha_iv text NOT NULL,
  valido_de timestamptz NOT NULL,
  valido_ate timestamptz NOT NULL,
  ativo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificados_digitais TO authenticated;
GRANT ALL ON public.certificados_digitais TO service_role;

ALTER TABLE public.certificados_digitais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_admin_all" ON public.certificados_digitais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'))
  WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'));

CREATE TRIGGER trg_certificados_digitais_updated
  BEFORE UPDATE ON public.certificados_digitais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Garante apenas 1 certificado ativo por empresa
CREATE UNIQUE INDEX IF NOT EXISTS ux_certificado_ativo_por_empresa
  ON public.certificados_digitais (empresa_id) WHERE ativo = true;

-- Colunas de rastreio de XML/DANFE armazenados localmente + ambiente
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS xml_storage_path text,
  ADD COLUMN IF NOT EXISTS danfe_storage_path text,
  ADD COLUMN IF NOT EXISTS ambiente text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_ambiente_chk'
  ) THEN
    ALTER TABLE public.notas_fiscais
      ADD CONSTRAINT notas_fiscais_ambiente_chk
      CHECK (ambiente IS NULL OR ambiente IN ('homologacao','producao'));
  END IF;
END $$;
