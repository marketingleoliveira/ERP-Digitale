import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getPlanosInspecao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { artigo_id?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("qualidade_planos")
      .select("*, caracteristicas:qualidade_plano_caracteristicas(*)")
      .eq("status", "ativo");
    
    if (data.artigo_id) q = q.eq("artigo_id", data.artigo_id);
    
    const { data: res, error } = await q;
    if (error) throw error;
    return res;
  });

const completeInspecaoSchema = z.object({
  lote_id: z.string().uuid(),
  inspecao_id: z.string().uuid(),
  resultados: z.array(z.object({
    caracteristica_id: z.string().uuid(),
    valor_medido: z.number().nullable(),
    resultado_qualitativo: z.string().nullable(),
    conforme: z.boolean()
  })),
  defeitos: z.array(z.object({
    tipo_defeito: z.string(),
    severidade: z.string(),
    quantidade: z.number(),
    localizacao: z.string().optional()
  })),
  classificacoes: z.object({
    aprovada: z.number().default(0),
    reprovada: z.number().default(0),
    reprocesso: z.number().default(0),
    quarentena: z.number().default(0),
    refugo: z.number().default(0)
  }),
  parecer: z.string().optional(),
  idempotency_key: z.string().uuid().optional()
});

export const completeLotQualityInspection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => completeInspecaoSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("complete_lot_quality_inspection", {
      p_lote_id: data.lote_id,
      p_inspecao_id: data.inspecao_id,
      p_resultados: data.resultados,
      p_defeitos: data.defeitos,
      p_classificacoes: data.classificacoes,
      p_parecer: data.parecer || null,
      p_idempotency_key: data.idempotency_key || null
    });
    if (error) throw error;
    return res;
  });

export const releaseLotForCommercialUse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lote_id: string; deposito: string; idempotency_key?: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("release_lot_for_commercial_use", {
      p_lote_id: data.lote_id,
      p_deposito: data.deposito,
      p_idempotency_key: data.idempotency_key || null
    });
    if (error) throw error;
    return res;
  });
