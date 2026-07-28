import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ParametroSchema = z.object({
  id: z.string().optional(),
  operacao_id: z.string(),
  nome: z.string(),
  valor_referencia: z.string().optional(),
  tolerancia_min: z.string().optional(),
  tolerancia_max: z.string().optional(),
  obrigatorio: z.boolean().default(false),
});

const MaquinaSubstituicaoSchema = z.object({
  id: z.string().optional(),
  maquina_principal_id: z.string(),
  maquina_reserva_id: z.string(),
  prioridade: z.number().default(1),
  motivo_uso: z.string().optional(),
});

export const getOperacaoParametros = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ operacaoId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase
      .from("roteiro_operacao_parametros")
      .select("*")
      .eq("operacao_id", data.operacaoId)
      .order("nome");
    if (error) throw error;
    return res;
  });

export const saveOperacaoParametro = createServerFn({ method: "POST" })
  .inputValidator((data) => ParametroSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase.from("roteiro_operacao_parametros").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("roteiro_operacao_parametros").insert(rest);
      if (error) throw error;
    }
    return { success: true };
  });

export const getMaquinasSubstituicao = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ maquinaPrincipalId: z.string().optional() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let query = supabase.from("maquina_substituicao").select("*, maquina_reserva:maquinas!maquina_reserva_id(*)");
    if (data.maquinaPrincipalId) query = query.eq("maquina_principal_id", data.maquinaPrincipalId);
    const { data: res, error } = await query.order("prioridade");
    if (error) throw error;
    return res;
  });

export const saveMaquinaSubstituicao = createServerFn({ method: "POST" })
  .inputValidator((data) => MaquinaSubstituicaoSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase.from("maquina_substituicao").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("maquina_substituicao").insert(rest);
      if (error) throw error;
    }
    return { success: true };
  });
