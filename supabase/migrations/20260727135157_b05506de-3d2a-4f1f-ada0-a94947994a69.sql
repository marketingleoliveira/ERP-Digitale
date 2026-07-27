DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Limpeza
    DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'marketing@digitaletextil.com.br');
    DELETE FROM public.profiles WHERE email = 'marketing@digitaletextil.com.br';
    DELETE FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'marketing@digitaletextil.com.br');
    DELETE FROM auth.users WHERE email = 'marketing@digitaletextil.com.br';

    -- 2. Recriação do Usuário
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'marketing@digitaletextil.com.br',
        extensions.crypt('Marketing12!', extensions.gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Admin Master DEV"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO v_user_id;

    -- 3. Identidade
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at,
        provider_id
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
        now(),
        now(),
        now(),
        v_user_id
    );

    -- 4. Perfil e Roles
    INSERT INTO public.profiles (id, nome, email, ativo)
    VALUES (v_user_id, 'Admin Master DEV', 'marketing@digitaletextil.com.br', true);

    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'desenvolvedor');

END $$;