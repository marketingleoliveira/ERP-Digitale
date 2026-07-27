import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { createMaterialReservation, cancelReservation, fetchMaterialReservations } from '@/lib/mrp-suggestions';

describe('Reserva Transacional de Materiais (Etapa 5)', () => {
  // IDs confirmados via supabase--read_query no turno anterior
  let testOpId: string = '146b2ca6-0759-4bd7-97cc-c51465bea494';
  let testLoteId: string = '79a69fa2-a350-4b38-839e-9b164c56d3cc';
  let testItemId: string = '9783df75-12cd-460c-b1d5-558e1baef3a0';
  let testReservaId: string;

  it('deve criar uma reserva vinculada a um lote e comprometer o saldo', async () => {
    // Verificamos o saldo antes
    const { data: loteAntes, error: errorAntes } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    if (errorAntes || !loteAntes) throw new Error(`Lote não encontrado no teste: ${errorAntes?.message}`);

    const qtyToReserve = 5;

    testReservaId = await createMaterialReservation({
      opId: testOpId,
      itemId: testItemId,
      quantity: qtyToReserve,
      loteId: testLoteId
    });

    expect(testReservaId).toBeDefined();

    // Verificamos se o saldo foi subtraído corretamente
    const { data: loteDepois } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    expect(Number(loteDepois!.quantidade_disponivel)).toBe(Number(loteAntes.quantidade_disponivel) - qtyToReserve);
  });

  it('deve listar reservas de uma OP específica', async () => {
    const reservas = await fetchMaterialReservations(testOpId);
    expect(Array.isArray(reservas)).toBe(true);
    expect((reservas as any[]).some(r => r.id === testReservaId)).toBe(true);
  });

  it('deve cancelar uma reserva e devolver o saldo ao lote', async () => {
    const { data: loteAntes } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    const { data: reserva } = await supabase.from('reservas' as any).select('quantidade').eq('id', testReservaId).single();

    await cancelReservation(testReservaId);

    const { data: loteDepois } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    expect(Number(loteDepois!.quantidade_disponivel)).toBe(Number(loteAntes!.quantidade_disponivel) + Number((reserva as any).quantidade));
  });

  it('deve impedir reserva de quantidade superior ao disponível (Idempotência/Integridade)', async () => {
    const { data: lote } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    const impossibleQty = Number(lote!.quantidade_disponivel) + 1000;

    await expect(createMaterialReservation({
      opId: testOpId,
      itemId: testItemId,
      quantity: impossibleQty,
      loteId: testLoteId
    })).rejects.toThrow();
  });
});
