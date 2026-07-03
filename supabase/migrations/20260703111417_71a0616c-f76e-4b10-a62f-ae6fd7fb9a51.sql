
-- Add new role 'desenvolvedor' as the super-role (God mode)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'desenvolvedor';
