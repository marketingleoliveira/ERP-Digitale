-- Migration Corretiva para o Usuário Master Admin
-- Corrigindo a estrutura de autenticação e garantindo que o usuário tenha acesso completo

-- 1. Atualizar auth.users com os campos necessários para o GoTrue (Supabase Auth)
UPDATE auth.users 
SET 
    email_confirmed_at = now(),
    updated_at = now(),
    last_sign_in_at = NULL, -- Resetar para forçar uma nova sessão limpa
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    raw_user_meta_data = '{"full_name":"Admin Master DEV"}'::jsonb,
    aud = 'authenticated',
    role = 'authenticated',
    instance_id = '00000000-0000-0000-0000-000000000000' -- Padrão Supabase quando não especificado
WHERE email = 'marketing@digitaletextil.com.br';

-- 2. Recriar auth.identities com o formato exato esperado pelo provedor 'email'
DELETE FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'marketing@digitaletextil.com.br');

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    id,
    jsonb_build_object(
        'sub', id, 
        'email', email, 
        'email_verified', true, 
        'full_name', 'Admin Master DEV'
    ),
    'email',
    id::text, -- Para provedor email, o provider_id é o UUID do usuário
    now(),
    now(),
    now()
FROM auth.users 
WHERE email = 'marketing@digitaletextil.com.br';

-- 3. Sincronizar public.profiles e garantir status ativo
INSERT INTO public.profiles (id, nome, email, ativo)
SELECT id, 'Admin Master DEV', email, true 
FROM auth.users WHERE email = 'marketing@digitaletextil.com.br'
ON CONFLICT (id) DO UPDATE SET ativo = true, nome = 'Admin Master DEV';

-- 4. Garantir as roles necessárias (RBAC)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'marketing@digitaletextil.com.br'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'desenvolvedor' FROM auth.users WHERE email = 'marketing@digitaletextil.com.br'
ON CONFLICT DO NOTHING;
