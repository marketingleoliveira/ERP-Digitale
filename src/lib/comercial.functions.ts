import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
  .input(z.object({ pedidoId: z.string() }))
  .handler(async ({ input }) => {
    const { data, error } = await supabase.rpc("simulate_sales_order_reservation", {
      p_pedido_id: input.pedidoId
    });

    if (error) throw new Error(error.message);
    return data as SimulacaoReserva[];
  });

export const reserveOrderStock = createServerFn({ method: "POST" })
  .input(z.object({ pedidoId: z.string(), idempotencyKey: z.string() }))
  .handler(async ({ input }) => {
    const { data, error } = await supabase.rpc("reserve_stock_for_sales_order", {
      p_pedido_id: input.pedidoId,
      p_idempotency_key: input.idempotencyKey
    });

    if (error) throw new Error(error.message);
    return data;
  });

export const shipOrder = createServerFn({ method: "POST" })
  .input(z.object({ pedidoId: z.string() }))
  .handler(async ({ input }) => {
    const { data, error } = await supabase.rpc("ship_sales_order", {
      p_pedido_id: input.pedidoId
    });

    if (error) throw new Error(error.message);
    return data;
  });

export const getEstoqueComercial = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("vw_estoque_comercial")
      .select("*");

    if (error) throw new Error(error.message);
    return data;
  });

export const getRNCs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("nao_conformidades")
      .select("*, responsavel:profiles(full_name), lote:lotes(numero_lote)");

    if (error) throw new Error(error.message);
    return data;
  });
