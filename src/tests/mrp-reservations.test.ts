import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { createMaterialReservation, cancelReservation, fetchMaterialReservations } from '@/lib/mrp-suggestions';

describe('Reserva Transacional de Materiais (Etapa 5)', () => {
  let testOpId: string;
  let testItemId: string;
  let testLoteId: string;
  let testReservaId: string;

  beforeAll(async () => {
    // Busca dados reais para teste
    const { data: op } = await supabase.from('ordens_producao').select('id').limit(1).single();
    const { data: lote } = await supabase.from('lotes').select('id, item_id, quantidade_disponivel').gt('quantidade_disponivel', 10).limit(1).single();
    
    if (!op || !lote) throw new Error('Dados insuficientes para rodar testes de reserva.');
    
    testOpId = op.id;
    testLoteId = lote.id;
    testItemId = lote.item_id;
  });

  it('deve criar uma reserva vinculada a um lote e comprometer o saldo', async () => {
    const { data: loteAntes } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    if (!loteAntes) throw new Error('Lote não encontrado');
    
    const qtyToReserve = 5;

    testReservaId = await createMaterialReservation({
      opId: testOpId,
      itemId: testItemId,
      quantity: qtyToReserve,
      loteId: testLoteId
    });

    expect(testReservaId).toBeDefined();

    const { data: loteDepois } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    if (!loteDepois) throw new Error('Lote não encontrado após reserva');
    
    expect(Number(loteDepois.quantidade_disponivel)).toBe(Number(loteAntes.quantidade_disponivel) - qtyToReserve);
  });

  it('deve listar reservas de uma OP específica', async () => {
    const reservas = await fetchMaterialReservations(testOpId);
    expect(Array.isArray(reservas)).toBe(true);
    expect((reservas as any[]).some(r => r.id === testReservaId)).toBe(true);
  });

  it('deve cancelar uma reserva e devolver o saldo ao lote', async () => {
    const { data: loteAntes } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    if (!loteAntes) throw new Error('Lote não encontrado');
    
    const { data: reserva } = await supabase.from('reservas' as any).select('quantidade').eq('id', testReservaId).single();
    if (!reserva) throw new Error('Reserva não encontrada');

    await cancelReservation(testReservaId);

    const { data: loteDepois } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    if (!loteDepois) throw new Error('Lote não encontrado após cancelamento');
    
    expect(Number(loteDepois.quantidade_disponivel)).toBe(Number(loteAntes.quantidade_disponivel) + Number((reserva as any).quantidade));
  });

  it('deve falhar ao tentar reservar mais do que o disponível (concorrência/integridade)', async () => {
    const { data: lote } = await supabase.from('lotes').select('quantidade_disponivel').eq('id', testLoteId).single();
    if (!lote) throw new Error('Lote não encontrado');
    
    const impossibleQty = Number(lote.quantidade_disponivel) + 1000;

    await expect(createMaterialReservation({
      opId: testOpId,
      itemId: testItemId,
      quantity: impossibleQty,
      loteId: testLoteId
    })).rejects.toThrow(/insuficiente/);
  });
});
