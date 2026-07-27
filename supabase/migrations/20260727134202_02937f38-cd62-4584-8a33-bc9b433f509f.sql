DO $$
DECLARE
  v_user_id uuid := '7b9eea91-9ff2-4e86-9fc2-d773d45f969d';
BEGIN
  -- 1. Forçar a confirmação do e-mail (apenas colunas não geradas)
  UPDATE auth.users 
  SET email_confirmed_at = now(), 
      last_sign_in_at = NULL,
      updated_at = now()
  WHERE id = v_user_id;

  -- 2. Limpeza e Recriação da Identidade (Causa comum de erro {} quando dessincronizado)
  DELETE FROM auth.identities WHERE user_id = v_user_id;
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id,
      'email', 'marketing@digitaletextil.com.br',
      'email_verified', true,
      'full_name', 'Admin Master DEV'
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- 3. Garantir Perfil e Role Master
  INSERT INTO public.profiles (id, email, nome, ativo)
  VALUES (v_user_id, 'marketing@digitaletextil.com.br', 'Admin Master DEV', true)
  ON CONFLICT (id) DO UPDATE SET ativo = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'), (v_user_id, 'desenvolvedor')
  ON CONFLICT DO NOTHING;

END $$;