import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Operações de Acabamento
 */
const finishOpSchema = z.object({
  lote_id: z.string().uuid(),
  operacao_id: z.string().uuid().optional(),
  maquina_id: z.string().uuid().optional(),
  fornecedor_id: z.string().uuid().optional(),
  quantidade_entrada: z.number().positive(),
  quantidade_saida: z.number().positive(),
  perda: z.number().optional(),
  parametros: z.record(z.any()).optional(),
  observacao: z.string().optional()
});

export const registrarAcabamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => finishOpSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const user_id = (await supabase.auth.getUser()).data.user?.id;
    
    const { data: res, error } = await supabase
      .from("op_acabamentos")
      .insert({
        lote_id: data.lote_id,
        operacao_id: data.operacao_id,
        maquina_id: data.maquina_id,
        fornecedor_id: data.fornecedor_id,
        quantidade_entrada: data.quantidade_entrada,
        quantidade_saida: data.quantidade_saida,
        perda: data.perda || (data.quantidade_entrada - data.quantidade_saida),
        responsavel_id: user_id,
        parametros: data.parametros,
        status: 'CONCLUIDO',
        data_inicio: new Date().toISOString(),
        data_fim: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return res;
  });

/**
 * Revisão de Lote / Rolo
 */
const reviewLoteSchema = z.object({
  lote_id: z.string().uuid(),
  peso_revisado: z.number().positive(),
  metragem_revisada: z.number().optional(),
  largura_media: z.number().optional(),
  pontos_defeito: z.number().optional(),
  classificacao: z.string(),
  observacao: z.string().optional(),
  rolos: z.array(z.object({
    numero_rolo: z.string(),
    peso: z.number().positive(),
    metragem: z.number().optional(),
    largura: z.number().optional(),
    tonalidade: z.string().optional(),
    classificacao: z.string().optional()
  })).optional()
});

export const registrarRevisao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => reviewLoteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const user_id = (await supabase.auth.getUser()).data.user?.id;

    // 1. Criar registro de revisão
    const { data: rev, error: revError } = await supabase
      .from("lote_revisoes")
      .insert({
        lote_id: data.lote_id,
        revisor_id: user_id,
        peso_revisado: data.peso_revisado,
        metragem_revisada: data.metragem_revisada,
        largura_media: data.largura_media,
        pontos_defeito: data.pontos_defeito,
        classificacao: data.classificacao as any,
        observacao: data.observacao
      })
      .select()
      .single();

    if (revError) throw revError;

    // 2. Criar rolos se fornecidos
    if (data.rolos && data.rolos.length > 0) {
      const rolosData = data.rolos.map(r => ({
        lote_id: data.lote_id,
        numero_rolo: r.numero_rolo,
        peso: r.peso,
        metragem: r.metragem,
        largura: r.largura,
        tonalidade: r.tonalidade,
        classificacao: (r.classificacao || data.classificacao) as any
      }));

      const { error: roloError } = await supabase
        .from("lote_rolos")
        .insert(rolosData);
      
      if (roloError) throw roloError;
    }

    return rev;
  });
