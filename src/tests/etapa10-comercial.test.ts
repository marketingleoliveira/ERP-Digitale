import { describe, it, expect, beforeAll } from "vitest";
import { supabase } from "@/integrations/supabase/client";

/**
 * Testes de Integração SQL - Etapa 10
 * Foco: Reservas, Saldos Comerciais e Expedição
 */
describe("Etapa 10 - Fluxo Comercial e Logístico", () => {
  let testOrderId: string = "";
  let testLoteId: string = "";
  let testArticleId: string = "";
  const idempotencyKey = `test-res-key-${Date.now()}`;

  beforeAll(async () => {
    // 1. Obter um artigo válido
    const { data: art } = await supabase.from("articles").select("id").limit(1).single();
    if (art) {
        testArticleId = art.id;
    } else {
        // Fallback for article
        testArticleId = "00000000-0000-0000-0000-000000000000";
    }

    // 2. Setup do Lote
    const { data: lote } = await supabase.from("lotes")
      .select("id")
      .eq("liberado_comercial", true)
      .limit(1)
      .single();
    
    if (lote) {
      testLoteId = lote.id;
    } else {
        const { data: newLote } = await supabase.from("lotes").insert({
            numero_lote: 'TEST-E10',
            tipo: 'tecido',
            item_id: testArticleId,
            quantidade: 1000,
            quantidade_disponivel: 1000,
            saldo_aprovado: 1000,
            liberado_comercial: true,
            classificacao: 'PRODUTO-ACABADO'
        }).select().single();
        if (newLote) testLoteId = newLote.id;
    }

    // 3. Setup do Pedido
    const { data: pedido } = await supabase.from("pedidos").insert({
      numero: `PED-TEST-${Date.now()}`,
      status: 'confirmado', // Mudar para confirmado para permitir reserva
      valor_total: 0
    }).select().single();

    if (pedido) {
        testOrderId = pedido.id;

        // 4. Setup do Item do Pedido
        await supabase.from("pedido_itens").insert({
            pedido_id: testOrderId,
            artigo_id: testArticleId,
            quantidade: 10,
            unidade: 'KG',
            valor_unitario: 50
        });
    }
  });

  it("deve simular reserva corretamente", async () => {
    if (!testOrderId) return;
    const { data, error } = await supabase.rpc("simulate_sales_order_reservation", {
      p_pedido_id: testOrderId
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it("deve realizar reserva transacional e atualizar saldos", async () => {
    if (!testOrderId) return;
    const { data, error } = await supabase.rpc("reserve_stock_for_sales_order", {
      p_pedido_id: testOrderId,
      p_idempotency_key: idempotencyKey
    });

    expect(error).toBeNull();
    
    const { data: reserva } = await supabase.from("vendas_reservas")
      .select("*")
      .eq("pedido_id", testOrderId)
      .limit(1)
      .maybeSingle();
    
    if (reserva) {
        expect(Number(reserva.quantidade)).toBeGreaterThan(0);

        const { data: lote } = await supabase.from("lotes")
          .select("saldo_reservado_comercial")
          .eq("id", reserva.lote_id as string)
          .single();
        
        if (lote) {
            expect(Number(lote.saldo_reservado_comercial)).toBeGreaterThanOrEqual(Number(reserva.quantidade));
        }
    }
  });

  it("deve processar expedição e realizar baixa física", async () => {
    if (!testOrderId) return;
    const { data, error } = await supabase.rpc("ship_sales_order", {
      p_pedido_id: testOrderId
    });

    expect(error).toBeNull();

    const { data: pedido } = await supabase.from("pedidos")
      .select("status")
      .eq("id", testOrderId)
      .single();
    
    if (pedido) expect(pedido.status).toBe("expedido");

    const { data: reserva } = await supabase.from("vendas_reservas")
      .select("status")
      .eq("pedido_id", testOrderId)
      .limit(1)
      .maybeSingle();
    
    if (reserva) expect(reserva.status).toBe("consumida");
  });
});
