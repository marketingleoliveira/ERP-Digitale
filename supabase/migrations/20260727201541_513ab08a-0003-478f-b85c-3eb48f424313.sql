ALTER TABLE public.empresa ADD COLUMN IF NOT EXISTS focus_nfe_token_encryption_version TEXT DEFAULT 'v1';

-- Revoga acesso público aos campos sensíveis
REVOKE SELECT ON public.empresa FROM anon;
REVOKE SELECT ON public.empresa FROM authenticated;

-- Garante acesso a campos não sensíveis para authenticated
GRANT SELECT (
  id, cnpj, razao_social, uf, crt, email, telefone, 
  provedor_nfe, ambiente_nfe, serie_nfe, proximo_numero_nfe,
  focus_nfe_token_updated_at, focus_nfe_token_updated_by,
  created_at, updated_at
) ON public.empresa TO authenticated;

-- O service_role mantém acesso total para o backend
GRANT ALL ON public.empresa TO service_role;

-- Comentário para auditoria
COMMENT ON COLUMN public.empresa.focus_nfe_token_ciphertext IS 'Token Focus NFe criptografado com AES-256-GCM. AuthTag incluso no final.';
COMMENT ON COLUMN public.empresa.focus_nfe_token_iv IS 'Initialization Vector (Base64) usado para a criptografia.';
COMMENT ON COLUMN public.empresa.focus_nfe_token_encryption_version IS 'Versão da chave/algoritmo para permitir rotação.';