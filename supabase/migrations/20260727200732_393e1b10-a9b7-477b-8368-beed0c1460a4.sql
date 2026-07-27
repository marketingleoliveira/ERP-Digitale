-- Migration: Secure Focus NFe Token storage with encryption
-- Implementation of Etapa 11.3 requirements

-- 1. Add encrypted storage columns to empresa table
ALTER TABLE public.empresa 
ADD COLUMN IF NOT EXISTS focus_nfe_token_ciphertext TEXT,
ADD COLUMN IF NOT EXISTS focus_nfe_token_iv TEXT,
ADD COLUMN IF NOT EXISTS focus_nfe_token_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS focus_nfe_token_updated_by UUID REFERENCES auth.users(id);

-- 2. Audit and update permissions
-- Ensure focus_nfe_token (legacy) and new fields are only accessible by authorized roles
-- RLS should already be enabled on empresa, but we ensure policies are tight.

-- Grant select on the new columns only to authenticated users (RLS will filter further)
GRANT SELECT (focus_nfe_token_ciphertext, focus_nfe_token_iv, focus_nfe_token_updated_at, focus_nfe_token_updated_by) ON public.empresa TO authenticated;
GRANT ALL ON public.empresa TO service_role;

-- 3. Comment for documentation
COMMENT ON COLUMN public.empresa.focus_nfe_token_ciphertext IS 'Criptografia AES-256-GCM do token Focus NFe';
COMMENT ON COLUMN public.empresa.focus_nfe_token_iv IS 'Initialization Vector para a criptografia do token';
