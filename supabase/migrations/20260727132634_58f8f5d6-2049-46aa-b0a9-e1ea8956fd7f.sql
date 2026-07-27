DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  target_email TEXT := 'marketing@digitaletextil.com.br';
  raw_password TEXT := 'Marketing12!';
BEGIN
  -- 1. Verificar se já existe (Limpeza de tentativa falha anterior se necessário, mas gen_random_uuid evita colisões de ID)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    
    -- 2. Inserir no auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role,
      confirmation_token,
      recovery_token,
      email_change_token_new
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      target_email,
      crypt(raw_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin Master DEV"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    );

    -- 3. Inserir Identidade (removendo a coluna 'email' que é gerada)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, target_email)::jsonb,
      'email',
      target_email,
      now(),
      now(),
      now()
    );

    -- 4. Criar/Atualizar Perfil na public.profiles
    -- A coluna 'ativo' foi confirmada anteriormente como existente
    INSERT INTO public.profiles (id, nome, email, ativo)
    VALUES (new_user_id, 'Admin Master DEV', target_email, TRUE)
    ON CONFLICT (id) DO UPDATE SET ativo = TRUE, nome = 'Admin Master DEV';

    -- 5. Atribuir Roles (Admin e Desenvolvedor)
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      (new_user_id, 'admin'),
      (new_user_id, 'desenvolvedor')
    ON CONFLICT (user_id, role) DO NOTHING;

  END IF;
END $$;
