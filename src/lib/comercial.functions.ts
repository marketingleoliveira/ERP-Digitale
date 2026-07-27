import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Tipagem básica
export interface SimulacaoReserva {
  pedido_item_id: string;
  artigo_id: string;
  variante_id?: string;
  cor_id?: string;
  quantidade_solicitada: number;
  quantidade_atendida: number;
  lotes_sugeridos: Array<{
    lote_id: string;
    numero_lote: string;
    quantidade: number;
  }>;
}

export const simulateOrderReservation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ pedidoId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase.rpc("simulate_sales_order_reservation", {
      p_pedido_id: data.pedidoId
    });

    if (error) throw new Error(error.message);
    return result as SimulacaoReserva[];
  });

export const reserveOrderStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ pedidoId: z.string(), idempotencyKey: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase.rpc("reserve_stock_for_sales_order", {
      p_pedido_id: data.pedidoId,
      p_idempotency_key: data.idempotencyKey
    });

    if (error) throw new Error(error.message);
    return result;
  });

export const shipOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ pedidoId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("ship_sales_order", {
      p_pedido_id: data.pedidoId
    });

    if (error) throw new Error(error.message);
    return result;
  });

export const getExpedicoesPendentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("op_expedicoes")
      .select("*, customer:transportadora_id(razao_social), pedido:pedido_id(numero_pedido)")
      .is("nota_fiscal_id", null);

    if (error) throw new Error(error.message);
    return data;
  });

export const getEstoqueComercial = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabase
      .from("vw_estoque_comercial")
      .select("*");

    if (error) throw new Error(error.message);
    return data;
  });

export const getRNCs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Simplified to avoid join issues for now
    const { data, error } = await supabase
      .from("nao_conformidades")
      .select("*, lote:lotes(numero_lote)");

    if (error) throw new Error(error.message);
    return data;
  });
