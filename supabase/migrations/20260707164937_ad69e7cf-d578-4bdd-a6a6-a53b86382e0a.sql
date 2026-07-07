
-- Prevent duplicates across business identifiers (partial uniques allow NULL/empty)
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_cpf_uniq ON public.funcionarios (cpf) WHERE cpf IS NOT NULL AND cpf <> '';
CREATE UNIQUE INDEX IF NOT EXISTS customers_cpf_uniq ON public.customers (cpf) WHERE cpf IS NOT NULL AND cpf <> '';
CREATE UNIQUE INDEX IF NOT EXISTS tinturarias_cnpj_uniq ON public.tinturarias (cnpj) WHERE cnpj IS NOT NULL AND cnpj <> '';
CREATE UNIQUE INDEX IF NOT EXISTS fios_codigo_uniq ON public.fios (codigo) WHERE codigo IS NOT NULL AND codigo <> '';
CREATE UNIQUE INDEX IF NOT EXISTS composicoes_codigo_uniq ON public.composicoes (codigo) WHERE codigo IS NOT NULL AND codigo <> '';
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_email_uniq ON public.funcionarios (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS sales_reps_email_uniq ON public.sales_reps (lower(email)) WHERE email IS NOT NULL AND email <> '';
