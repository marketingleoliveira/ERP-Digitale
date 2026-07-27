
-- 1. Adicionar colunas de status e metadados de credencial na tabela empresa
ALTER TABLE public.empresa 
ADD COLUMN IF NOT EXISTS focus_nfe_token_status TEXT DEFAULT 'PENDING_VALIDATION' CHECK (focus_nfe_token_status IN ('MISSING', 'PENDING_VALIDATION', 'VALID', 'INVALID', 'REVOKED', 'ENVIRONMENT_MISMATCH', 'PROVIDER_UNAVAILABLE')),
ADD COLUMN IF NOT EXISTS focus_nfe_token_last_error_code TEXT,
ADD COLUMN IF NOT EXISTS focus_nfe_token_last_error_at TIMESTAMPTZ;

-- 2. Atualizar permissões RLS
REVOKE ALL (focus_nfe_token, focus_nfe_token_ciphertext, focus_nfe_token_iv, focus_nfe_token_encryption_version) ON TABLE public.empresa FROM public, authenticated, anon;
GRANT ALL (focus_nfe_token, focus_nfe_token_ciphertext, focus_nfe_token_iv, focus_nfe_token_encryption_version) ON TABLE public.empresa TO service_role;

-- 3. Função para registro de log fiscal com classificação PROVIDER_AUTH_FAILED
CREATE OR REPLACE FUNCTION public.log_nfe_event(
    _acao TEXT,
    _http_status INTEGER,
    _request JSONB,
    _response JSONB,
    _user_id UUID,
    _nota_fiscal_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    _log_id UUID;
BEGIN
    INSERT INTO public.nfe_logs (acao, http_status, request, response, user_id, nota_fiscal_id)
    VALUES (_acao, _http_status, _request, _response, _user_id, _nota_fiscal_id)
    RETURNING id INTO _log_id;
    
    -- Se for erro de autenticação (401), marca o token como inválido na empresa
    IF _http_status = 401 THEN
        UPDATE public.empresa 
        SET focus_nfe_token_status = 'INVALID',
            focus_nfe_token_last_error_code = 'PROVIDER_AUTH_FAILED',
            focus_nfe_token_last_error_at = now()
        WHERE provedor_nfe = 'focus_nfe';
    END IF;

    RETURN _log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.log_nfe_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_nfe_event TO service_role;
