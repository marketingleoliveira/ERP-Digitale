import { describe, it, expect } from 'vitest';

describe('Reserva Transacional de Materiais (Etapa 5) - Mock Logic Validation', () => {
  let mockLoteStock = 1000;
  let mockReservas: any[] = [];

  const mockReserveMaterial = (qty: number) => {
    if (qty > mockLoteStock) throw new Error('Saldo insuficiente');
    mockLoteStock -= qty;
    const resId = Math.random().toString(36);
    mockReservas.push({ id: resId, quantity: qty });
    return resId;
  };

  const mockCancelReservation = (id: string) => {
    const idx = mockReservas.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Reserva não encontrada');
    mockLoteStock += mockReservas[idx].quantity;
    mockReservas.splice(idx, 1);
  };

  it('deve comprometer saldo do lote ao reservar', () => {
    const initial = mockLoteStock;
    const id = mockReserveMaterial(100);
    expect(mockLoteStock).toBe(initial - 100);
    expect(mockReservas.length).toBe(1);
  });

  it('deve devolver saldo ao cancelar', () => {
    const initial = mockLoteStock;
    const res = mockReservas[0];
    mockCancelReservation(res.id);
    expect(mockLoteStock).toBe(initial + res.quantity);
  });

  it('deve falhar se saldo for insuficiente', () => {
    expect(() => mockReserveMaterial(5000)).toThrow('Saldo insuficiente');
  });
});
