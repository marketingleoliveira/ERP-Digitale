BEGIN;

-- 1. Atualizar metadados básicos em auth.users para garantir conformidade
UPDATE auth.users
SET 
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  raw_user_meta_data = '{"full_name":"Admin Master DEV"}',
  is_sso_user = false,
  updated_at = now(),
  confirmation_token = NULL,
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  recovery_token = NULL,
  last_sign_in_at = NULL
WHERE email = 'marketing@digitaletextil.com.br';

-- 2. Reconstruir a identidade de forma limpa
DELETE FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'marketing@digitaletextil.com.br');

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
)
SELECT 
  gen_random_uuid(),
  id,
  json_build_object(
    'sub', id,
    'email', email,
    'email_verified', true,
    'full_name', 'Admin Master DEV'
  ),
  'email',
  now(),
  now(),
  now(),
  id
FROM auth.users 
WHERE email = 'marketing@digitaletextil.com.br';

-- 3. Garantir perfil ativo
UPDATE public.profiles 
SET ativo = true 
WHERE email = 'marketing@digitaletextil.com.br';

-- 4. Garantir roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'marketing@digitaletextil.com.br'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'desenvolvedor'::app_role FROM auth.users WHERE email = 'marketing@digitaletextil.com.br'
ON CONFLICT DO NOTHING;

COMMIT;