import { describe, it, expect } from "vitest";
import {
  capacidadeEfetivaHora,
  capacidadeKgDia,
  duracaoHoras,
  turnosNecessarios,
  type MaquinaCap,
} from "./capacidade";

// Cenário do seed E2E
const SEED: MaquinaCap = {
  kg_por_hora: 25,
  horas_por_turno: 8,
  turnos_por_dia: 2,
  eficiencia_alvo_pct: 85,
};
const QTD = 324.45;

describe("capacidade — cenário do seed (Digitale)", () => {
  it("capacidade efetiva/hora = 25 × 0,85 = 21,25", () => {
    expect(capacidadeEfetivaHora(SEED)).toBeCloseTo(21.25, 4);
  });

  it("capacidade/dia = 21,25 × 8 × 2 = 340 kg", () => {
    expect(capacidadeKgDia(SEED)).toBeCloseTo(340, 4);
  });

  it("duração para 324,45 kg ≈ 15,27 h", () => {
    const h = duracaoHoras(QTD, capacidadeEfetivaHora(SEED));
    expect(h).not.toBeNull();
    expect(h!).toBeCloseTo(15.27, 2);
  });

  it("ocupação ≈ 1,91 turnos de 8 h", () => {
    const t = turnosNecessarios(QTD, SEED);
    expect(t).not.toBeNull();
    expect(t!).toBeCloseTo(1.91, 2);
  });

  it("não aplica eficiência duas vezes: capacidade líquida cadastrada + ef=100 dá mesmo resultado", () => {
    const liquida: MaquinaCap = { ...SEED, kg_por_hora: 21.25, eficiencia_alvo_pct: 100 };
    expect(capacidadeEfetivaHora(liquida)).toBeCloseTo(capacidadeEfetivaHora(SEED), 4);
    expect(capacidadeKgDia(liquida)).toBeCloseTo(capacidadeKgDia(SEED), 4);
  });

  it("retorna null quando capacidade for 0", () => {
    expect(duracaoHoras(100, 0)).toBeNull();
    expect(turnosNecessarios(100, { ...SEED, kg_por_hora: 0 })).toBeNull();
  });
});
