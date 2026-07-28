import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * List all MES agents with summary metrics.
 */
export const listAgents = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("mes_agents")
      .select(`
        *,
        mes_heartbeats (
          status,
          version,
          pending_events_count,
          created_at
        ),
        mes_events (
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

/**
 * Generate a new single-use activation code.
 */
export const createActivationCode = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string(),
    unidade: z.string(),
    authorized_machines: z.array(z.string().uuid())
  }).parse)
  .handler(async ({ data }) => {
    const activation_code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    const { data: agent, error } = await supabase
      .from("mes_agents")
      .insert({
        name: data.name,
        unidade: data.unidade,
        authorized_machines: data.authorized_machines,
        activation_code,
        activation_code_expires_at: expires_at,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return agent;
  });

/**
 * Revoke or block an agent.
 */
export const updateAgentStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    agent_id: z.string().uuid(),
    status: z.enum(['active', 'blocked']),
    reason: z.string().optional()
  }).parse)
  .handler(async ({ data }) => {
    const { data: agent, error } = await supabase
      .from("mes_agents")
      .update({ status: data.status })
      .eq("id", data.agent_id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from("mes_agent_logs").insert({
      agent_id: data.agent_id,
      action: `status_change_${data.status}`,
      payload: { reason: data.reason }
    });

    return agent;
  });

/**
 * Get pending events with errors for auditing.
 */
export const listErrorEvents = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("mes_events")
      .select(`
        *,
        mes_agents (name, unidade)
      `)
      .neq("status", "processed")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });
