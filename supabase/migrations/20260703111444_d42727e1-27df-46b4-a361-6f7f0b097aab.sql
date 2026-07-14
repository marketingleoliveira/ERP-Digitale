
-- 1) Migrate all existing 'admin' role assignments to 'desenvolvedor'
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'desenvolvedor'::app_role FROM public.user_roles WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles WHERE role = 'admin';

-- 2) has_role: desenvolvedor has ALL roles (god mode)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'desenvolvedor'::app_role)
  );
$function$;

-- 3) is_admin_or_gerente: desenvolvedor and gerente pass
CREATE OR REPLACE FUNCTION public.is_admin_or_gerente(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('desenvolvedor'::app_role, 'gerente'::app_role)
  );
$function$;

-- 4) handle_new_user: first user becomes 'desenvolvedor' instead of 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'cargo'
  );

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'desenvolvedor');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor');
  END IF;
  RETURN NEW;
END;
$function$;
