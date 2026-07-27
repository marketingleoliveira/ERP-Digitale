import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const simulateInputSchema = z.object({
  opId: z.string().uuid(),
  quantidadeEntrada: z.number().positive(),
  deposito: z.string().optional(),
  classificacao: z.string().optional(),
});

export const simulateProductionReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => simulateInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("simulate_production_receipt", {
      p_op_id: data.opId,
      p_quantidade_entrada: data.quantidadeEntrada,
      p_deposito: data.deposito || null,
      p_classificacao: data.classificacao || null,
    });
    if (error) throw new Error(error.message);
    return res;
  });

const receiveInputSchema = z.object({
  opId: z.string().uuid(),
  quantidade: z.number().positive(),
  deposito: z.string(),
  classificacao: z.string(),
  idempotencyKey: z.string().uuid().optional(),
  observacao: z.string().optional(),
});

export const receiveProductionOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => receiveInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("receive_production_output", {
      p_op_id: data.opId,
      p_quantidade: data.quantidade,
      p_deposito: data.deposito,
      p_classificacao: data.classificacao,
      p_idempotency_key: data.idempotencyKey || null,
      p_observacao: data.observacao || null,
    });
    if (error) throw new Error(error.message);
    return res;
  });

const reverseInputSchema = z.object({
  entradaId: z.string().uuid(),
  motivo: z.string().min(5),
});

export const reverseProductionReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => reverseInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("reverse_production_receipt", {
      p_entrada_id: data.entradaId,
      p_motivo: data.motivo,
    });
    if (error) throw new Error(error.message);
    return res;
  });
