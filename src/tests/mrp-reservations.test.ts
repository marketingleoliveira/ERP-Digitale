import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { createMaterialReservation, cancelReservation, fetchMaterialReservations } from '@/lib/mrp-suggestions';

describe('Reserva Transacional de Materiais (Etapa 5)', () => {
  // IDs confirmados via supabase--read_query
  const testOpId = '146b2ca6-0759-4bd7-97cc-c51465bea494';
  const testLoteId = '79a69fa2-a350-4b38-839e-9b164c56d3cc';
  const testItemId = '9783df75-12cd-460c-b1d5-558e1baef3a0';
  let testReservaId: string;

  it('deve criar uma reserva vinculada a um lote e comprometer o saldo', async () => {
    // Verificamos o saldo antes (sem .single() para evitar erro de coerção se houver lixo)
    const { data: lotesAntes, error: errorAntes } = await supabase
        .from('lotes')
        .select('quantidade_disponivel')
        .eq('id', testLoteId);
    
    if (errorAntes || !lotesAntes?.length) throw new Error(`Lote não encontrado: ${errorAntes?.message}`);
    const loteAntes = lotesAntes[0];

    const qtyToReserve = 5;

    testReservaId = await createMaterialReservation({
      opId: testOpId,
      itemId: testItemId,
      quantity: qtyToReserve,
      loteId: testLoteId
    });

    expect(testReservaId).toBeDefined();

    // Verificamos se o saldo foi subtraído corretamente
    const { data: lotesDepois } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId);
    expect(Number(lotesDepois![0].quantidade_disponivel)).toBe(Number(loteAntes.quantidade_disponivel) - qtyToReserve);
  });

  it('deve listar reservas de uma OP específica', async () => {
    const reservas = await fetchMaterialReservations(testOpId);
    expect(Array.isArray(reservas)).toBe(true);
    // Verificamos se a reserva que criamos está na lista
    expect((reservas as any[]).some(r => r.id === testReservaId)).toBe(true);
  });

  it('deve cancelar uma reserva e devolver o saldo ao lote', async () => {
    const { data: lotesAntes } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId);
    const { data: reservas } = await supabase.from('reservas' as any).select('quantidade').eq('id', testReservaId);

    if (!lotesAntes?.length || !reservas?.length) throw new Error('Dados para cancelamento não encontrados');

    await cancelReservation(testReservaId);

    const { data: lotesDepois } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId);
    expect(Number(lotesDepois![0].quantidade_disponivel)).toBe(Number(lotesAntes[0].quantidade_disponivel) + Number(reservas[0].quantidade));
  });

  it('deve impedir reserva de quantidade superior ao disponível', async () => {
    const { data: lotes } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId);
    const impossibleQty = Number(lotes![0].quantidade_disponivel) + 1000;

    await expect(createMaterialReservation({
      opId: testOpId,
      itemId: testItemId,
      quantity: impossibleQty,
      loteId: testLoteId
    })).rejects.toThrow();
  });
});
