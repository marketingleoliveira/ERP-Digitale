import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const preFaturamentoSchema = z.object({
  expedicaoId: z.string().uuid(),
  naturezaId: z.string().uuid(),
  frete: z.number().optional().default(0),
  seguro: z.number().optional().default(0),
  despesas: z.number().optional().default(0),
  desconto: z.number().optional().default(0),
  observacoes: z.string().optional(),
  idempotencyKey: z.string().uuid(),
});

export const simulateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ expedicaoId: z.string().uuid(), naturezaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("simulate_sales_invoice", {
      p_expedicao_id: data.expedicaoId,
      p_natureza_id: data.naturezaId
    });
    if (error) throw new Error(error.message);
    return result;
  });

export const createPreFaturamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => preFaturamentoSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    
    // 1. Simular para obter valores recalculados no servidor
    const { data: simulacao, error: sErr } = await supabase.rpc("simulate_sales_invoice", {
      p_expedicao_id: data.expedicaoId,
      p_natureza_id: data.naturezaId
    });
    if (sErr) throw new Error(sErr.message);

    const sim = simulacao as any;

    // 2. Criar registro de pré-faturamento
    const { data: pre, error: pErr } = await supabase.from("pre_faturamentos").insert({
      expedicao_id: data.expedicaoId,
      natureza_id: data.naturezaId,
      status: "validado",
      valor_produtos: sim.valor_produtos,
      valor_total: sim.valor_total + data.frete + data.seguro + data.despesas - data.desconto,
      idempotency_key: data.idempotencyKey,
      payload_fiscal: sim
    }).select().single();

    if (pErr) throw new Error(pErr.message);

    // 3. Criar itens
    const itens = sim.itens.map((it: any) => ({
      pre_faturamento_id: pre.id,
      descricao: it.descricao,
      quantidade: it.quantidade,
      unidade: it.unidade,
      valor_unitario: it.valor_unitario,
      valor_total: it.valor_total,
      cfop: it.cfop,
      cst: it.cst
    }));

    const { error: iErr } = await supabase.from("pre_faturamento_itens").insert(itens);
    if (iErr) throw new Error(iErr.message);

    return pre;
  });

export const getNaturezasOperacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.from("naturezas_operacao").select("*").eq("ativo", true);
    if (error) throw new Error(error.message);
    return data;
  });

export const finalizeInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ notaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: result, error } = await supabase.rpc("finalize_authorized_sales_invoice", {
      p_nota_id: data.notaId,
      p_user_id: userId
    });
    if (error) throw new Error(error.message);
    return result;
  });
