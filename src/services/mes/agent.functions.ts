import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const registerAgentHeartbeat = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    agent_id: z.string().uuid(),
    version: z.string(),
    status: z.string(),
    pending_events_count: z.number(),
  }).parse)
  .handler(async ({ data }) => {
    const { data: heartbeat, error } = await supabase
      .from("mes_heartbeats")
      .insert({
        agent_id: data.agent_id,
        version: data.version,
        status: data.status,
        pending_events_count: data.pending_events_count,
        local_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return heartbeat;
  });

export const syncEvents = createServerFn({ method: "POST" })
  .inputValidator(z.array(z.object({
    event_id: z.string().uuid(),
    agent_id: z.string().uuid(),
    event_type: z.enum([
      'production_started', 'production_paused', 'production_resumed',
      'production_quantity_reported', 'production_loss_reported',
      'downtime_started', 'downtime_finished', 'production_finished'
    ]),
    machine_id: z.string().uuid().optional(),
    op_id: z.string().uuid().optional(),
    operator_id: z.string().uuid().optional(),
    occurred_at: z.string().datetime(),
    payload: z.record(z.any()),
  })).parse)
  .handler(async ({ data }) => {
    const results = await Promise.all(data.map(async (event) => {
      try {
        const { error } = await supabase.from("mes_events").insert({
          event_id: event.event_id,
          agent_id: event.agent_id,
          event_type: event.event_type as any,
          machine_id: event.machine_id,
          op_id: event.op_id,
          operator_id: event.operator_id,
          occurred_at: event.occurred_at,
          payload: event.payload,
        });

        if (error) {
          if (error.code === '23505') return { event_id: event.event_id, status: 'processed', note: 'already_exists' };
          throw error;
        }

        // Trigger processing
        await supabase.rpc('process_mes_event', { p_event_id: event.event_id });
        
        return { event_id: event.event_id, status: 'processed' };
      } catch (err: any) {
        return { event_id: event.event_id, status: 'error', error: err.message };
      }
    }));
    return results;
  });
