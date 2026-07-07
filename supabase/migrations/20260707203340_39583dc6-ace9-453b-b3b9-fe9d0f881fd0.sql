
CREATE TABLE IF NOT EXISTS public.uf_aliquotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uf TEXT NOT NULL,
  sigla TEXT NOT NULL UNIQUE,
  codigo TEXT NOT NULL,
  icms_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  icms_st_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  icms_interno_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  icms_interestadual_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  fundo_pobreza_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.uf_aliquotas TO authenticated;
GRANT ALL ON public.uf_aliquotas TO service_role;

ALTER TABLE public.uf_aliquotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read uf_aliquotas" ON public.uf_aliquotas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/gerente manage uf_aliquotas" ON public.uf_aliquotas
  FOR ALL TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()))
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE TRIGGER trg_uf_aliquotas_updated
  BEFORE UPDATE ON public.uf_aliquotas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.uf_aliquotas (uf, sigla, codigo, icms_pct, icms_st_pct, icms_interno_pct, icms_interestadual_pct, fundo_pobreza_pct) VALUES
('Acre','AC','11',7.00,17.00,19.00,7.00,0.00),
('Alagoas','AL','27',7.00,17.00,18.00,7.00,1.00),
('Amapá','AP','16',7.00,17.00,18.00,7.00,0.00),
('Amazonas','AM','13',7.00,17.00,20.00,7.00,0.00),
('Bahia','BA','29',7.00,17.00,20.50,7.00,0.00),
('Ceará','CE','23',7.00,17.00,20.00,7.00,0.00),
('Distrito Federal','DF','53',7.00,17.00,20.00,7.00,0.00),
('Espírito Santo','ES','32',7.00,17.00,17.00,7.00,0.00),
('Exterior','EX','99',0.00,17.00,18.00,7.00,0.00),
('Goiás','GO','52',7.00,17.00,19.00,7.00,0.00),
('Maranhão','MA','21',7.00,17.00,22.00,7.00,0.00),
('Mato Grosso','MT','51',7.00,17.00,17.00,7.00,0.00),
('Mato Grosso do Sul','MS','50',7.00,17.00,17.00,7.00,0.00),
('Minas Gerais','MG','31',12.00,17.00,18.00,12.00,0.00),
('Pará','PA','15',7.00,17.00,19.00,7.00,0.00),
('Paraíba','PB','25',7.00,17.00,20.00,7.00,0.00),
('Paraná','PR','41',12.00,17.00,19.00,12.00,0.00),
('Pernambuco','PE','26',7.00,17.00,20.50,7.00,0.00),
('Piauí','PI','22',7.00,17.00,21.00,7.00,0.00),
('Rio de Janeiro','RJ','33',12.00,17.00,20.00,12.00,2.00),
('Rio Grande do Norte','RN','24',7.00,17.00,18.00,7.00,0.00),
('Rio Grande do Sul','RS','43',12.00,17.00,18.00,12.00,0.00),
('Rondônia','RO','11',7.00,17.00,19.50,7.00,0.00),
('Roraima','RR','14',7.00,17.00,20.00,7.00,0.00),
('Santa Catarina','SC','42',12.00,17.00,17.00,12.00,0.00),
('São Paulo','SP','35',18.00,17.00,18.00,18.00,0.00),
('Sergipe','SE','28',7.00,17.00,22.00,7.00,0.00),
('Tocantins','TO','17',7.00,17.00,20.00,7.00,0.00)
ON CONFLICT (sigla) DO NOTHING;
