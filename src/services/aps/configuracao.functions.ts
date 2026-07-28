import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CalendarioSchema = z.object({
  id: z.string().optional(),
  unidade_id: z.string().uuid(),
  data: z.string(),
  tipo: z.enum(['util', 'feriado', 'folga', 'manutencao', 'parada_geral']),
  descricao: z.string().optional().nullable(),
  capacidade_percentual: z.number().int().min(0).max(100).default(100),
});

const TurnoSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(1),
  nome: z.string().min(1),
  hora_inicio: z.string(),
  hora_fim: z.string(),
  intervalo_minutos: z.number().int().nonnegative().default(60),
  dias_semana: z.array(z.number().int().min(1).max(7)).default([1, 2, 3, 4, 5]),
  ativo: z.boolean().default(true),
});

export const getCalendario = createServerFn({ method: "GET" })
  .validator((data) => z.object({ unidadeId: z.string().uuid().optional() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let query = supabase.from("calendario_industrial").select("*");
    if (data.unidadeId) query = query.eq("unidade_id", data.unidadeId);
    const { data: res, error } = await query.order("data");
    if (error) throw error;
    return res;
  });

export const saveCalendario = createServerFn({ method: "POST" })
  .validator((data) => CalendarioSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase.from("calendario_industrial").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("calendario_industrial").insert(rest);
      if (error) throw error;
    }
    return { success: true };
  });

export const getTurnos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.from("turnos").select("*").order("codigo");
    if (error) throw error;
    return data;
  });

export const saveTurno = createServerFn({ method: "POST" })
  .validator((data) => TurnoSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase.from("turnos").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("turnos").insert(rest);
      if (error) throw error;
    }
    return { success: true };
  });
