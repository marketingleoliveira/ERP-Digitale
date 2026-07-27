-- Tentar resetar a senha explicitamente para garantir que o hash 'bf' (blowfish) funcionou corretamente
-- O erro '{}' costuma ser um erro de rede ou de configuração do client, 
-- mas vamos garantir que o usuário está 100% funcional no lado do servidor primeiro.

UPDATE auth.users 
SET encrypted_password = crypt('Marketing12!', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now(),
    last_sign_in_at = NULL -- resetar para forçar "primeiro login" se houver lógica
WHERE email = 'marketing@digitaletextil.com.br';

-- Garantir que a identidade existe e está correta
DELETE FROM auth.identities WHERE email = 'marketing@digitaletextil.com.br';

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
  format('{"sub":"%s","email":"%s"}', id, email)::jsonb,
  'email',
  email,
  now(),
  now(),
  now()
FROM auth.users 
WHERE email = 'marketing@digitaletextil.com.br';
