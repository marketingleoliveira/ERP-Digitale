import { describe, it, expect, beforeAll } from "vitest";
import { supabase } from "@/integrations/supabase/client";

/**
 * Testes de Integração SQL - Etapa 10
 * Foco: Reservas, Saldos Comerciais e Expedição
 */
describe("Etapa 10 - Fluxo Comercial e Logístico", () => {
  let testOrderId: string;
  let testItemId: string;
  let testLoteId: string;
  const idempotencyKey = `test-res-key-${Date.now()}`;

  beforeAll(async () => {
    // Setup: Precisa de um pedido, item e lote liberado
    const { data: lote } = await supabase.from("lotes")
      .select("id")
      .eq("liberado_comercial", true)
      .limit(1)
      .single();
    
    testLoteId = lote?.id;

    if (!testLoteId) {
        // Create mock lote if not exists
        const { data: newLote } = await supabase.from("lotes").insert({
            numero_lote: 'TEST-E10',
            tipo: 'tecido',
            item_id: '00000000-0000-0000-0000-000000000000', // Placeholder
            quantidade: 1000,
            quantidade_disponivel: 1000,
            saldo_aprovado: 1000,
            liberado_comercial: true,
            classificacao: 'PRODUTO-ACABADO'
        }).select().single();
        testLoteId = newLote.id;
    }

    const { data: pedido } = await supabase.from("pedidos").insert({
      numero: `PED-TEST-${Date.now()}`,
      status: 'rascunho',
      valor_total: 0
    }).select().single();

    testOrderId = pedido.id;

    const { data: item } = await supabase.from("pedido_itens").insert({
      pedido_id: testOrderId,
      artigo_id: '00000000-0000-0000-0000-000000000000',
      quantidade: 100,
      unidade: 'KG',
      valor_unitario: 50
    }).select().single();

    testItemId = item.id;
  });

  it("deve simular reserva corretamente", async () => {
    const { data, error } = await supabase.rpc("simulate_sales_order_reservation", {
      p_pedido_id: testOrderId
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it("deve realizar reserva transacional e atualizar saldos", async () => {
    const { data, error } = await supabase.rpc("reserve_stock_for_sales_order", {
      p_pedido_id: testOrderId,
      p_idempotency_key: idempotencyKey
    });

    expect(error).toBeNull();
    
    // Verificar se a reserva foi criada
    const { data: reserva } = await supabase.from("vendas_reservas")
      .select("*")
      .eq("pedido_id", testOrderId)
      .single();
    
    expect(reserva).toBeDefined();
    expect(Number(reserva.quantidade)).toBeGreaterThan(0);

    // Verificar saldo_reservado_comercial no lote
    const { data: lote } = await supabase.from("lotes")
      .select("saldo_reservado_comercial")
      .eq("id", reserva.lote_id)
      .single();
    
    expect(Number(lote.saldo_reservado_comercial)).toBeGreaterThanOrEqual(Number(reserva.quantidade));
  });

  it("deve processar expedição e realizar baixa física", async () => {
    const { data, error } = await supabase.rpc("ship_sales_order", {
      p_pedido_id: testOrderId
    });

    expect(error).toBeNull();

    // Verificar se o status do pedido mudou
    const { data: pedido } = await supabase.from("pedidos")
      .select("status")
      .eq("id", testOrderId)
      .single();
    
    expect(pedido.status).toBe("expedido");

    // Verificar se a reserva foi consumida
    const { data: reserva } = await supabase.from("vendas_reservas")
      .select("status")
      .eq("pedido_id", testOrderId)
      .single();
    
    expect(reserva.status).toBe("consumida");
  });
});
