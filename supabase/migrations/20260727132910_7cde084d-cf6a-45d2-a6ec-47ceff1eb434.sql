-- Correção final e simplificada
UPDATE auth.users 
SET email_confirmed_at = now(),
    encrypted_password = crypt('Marketing12!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'marketing@digitaletextil.com.br';

-- Perfil
INSERT INTO public.profiles (id, nome, email, ativo)
SELECT id, 'Admin Master DEV', email, TRUE
FROM auth.users
WHERE email = 'marketing@digitaletextil.com.br'
ON CONFLICT (id) DO UPDATE SET ativo = TRUE;

-- Identidade
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
  json_build_object('sub', id, 'email', email)::jsonb,
  'email',
  email,
  now(),
  now(),
  now()
FROM auth.users 
WHERE email = 'marketing@digitaletextil.com.br';
