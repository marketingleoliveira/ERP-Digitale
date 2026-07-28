
-- Migration: Admin MES Agents Management
-- Purpose: Security, RBAC and new fields for Agent Management

-- 1. Extend mes_agents for management
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending'));
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS authorized_machines UUID[] DEFAULT '{}';
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS activation_code_expires_at TIMESTAMPTZ;
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE public.mes_agents ADD COLUMN IF NOT EXISTS version TEXT;

-- 2. Grants (Ensuring access for public tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mes_agents TO authenticated;
GRANT ALL ON public.mes_agents TO service_role;

GRANT SELECT ON public.mes_heartbeats TO authenticated;
GRANT ALL ON public.mes_heartbeats TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mes_events TO authenticated;
GRANT ALL ON public.mes_events TO service_role;

-- 3. RLS Policies for Admin
-- Assumes a has_role function exists as per system instructions
-- Re-enable RLS just in case it was missed
ALTER TABLE public.mes_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mes_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mes_heartbeats ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if any to avoid conflicts during implementation
DROP POLICY IF EXISTS "Admins can manage mes_agents" ON public.mes_agents;
CREATE POLICY "Admins can manage mes_agents"
ON public.mes_agents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'));

DROP POLICY IF EXISTS "Admins can view heartbeats" ON public.mes_heartbeats;
CREATE POLICY "Admins can view heartbeats"
ON public.mes_heartbeats
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'));

DROP POLICY IF EXISTS "Admins can view and update events" ON public.mes_events;
CREATE POLICY "Admins can view and update events"
ON public.mes_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'));

-- 4. Audit Log Table for Agent Revocation/Actions
CREATE TABLE IF NOT EXISTS public.mes_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.mes_agents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.mes_agent_logs TO authenticated;
GRANT ALL ON public.mes_agent_logs TO service_role;
ALTER TABLE public.mes_agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view agent logs" ON public.mes_agent_logs;
CREATE POLICY "Admins can view agent logs"
ON public.mes_agent_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'));
