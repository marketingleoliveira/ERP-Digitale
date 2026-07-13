import { describe, it, expect } from "vitest";
import {
  capacidadeEfetivaHora,
  capacidadeKgDia,
  capacidadeKgSemana,
  duracaoHoras,
  turnosNecessarios,
  diasProdutivos,
  proximaDataProdutiva,
  type MaquinaCap,
} from "./capacidade";

const SEED: MaquinaCap = {
  kg_por_hora: 25,
  horas_por_turno: 8,
  turnos_por_dia: 2,
  eficiencia_alvo_pct: 85,
};
const QTD = 324.45;

describe("capacidade — cenário seed Digitale (fonte única)", () => {
  it("efetiva/h = 21,25 kg/h", () => expect(capacidadeEfetivaHora(SEED)).toBeCloseTo(21.25, 4));
  it("cap/dia = 340 kg", () => expect(capacidadeKgDia(SEED)).toBeCloseTo(340, 4));
  it("cap/semana (5 dias) = 1700 kg", () => expect(capacidadeKgSemana(SEED, 5)).toBeCloseTo(1700, 2));
  it("duração 324,45 kg ≈ 15,27 h", () => {
    expect(duracaoHoras(QTD, capacidadeEfetivaHora(SEED))!).toBeCloseTo(15.27, 2);
  });
  it("ocupação ≈ 1,91 turnos", () => expect(turnosNecessarios(QTD, SEED)!).toBeCloseTo(1.91, 2));
  it("dias produtivos ≈ 0,954 (< 1 dia)", () => {
    expect(diasProdutivos(QTD, capacidadeKgDia(SEED))!).toBeCloseTo(0.954, 3);
  });
  it("nunca usa 'duracao / 24' — dias vem de cap/dia", () => {
    const errado = 15.27 / 24;                              // ~0,636
    const certo = diasProdutivos(QTD, capacidadeKgDia(SEED))!; // ~0,954
    expect(certo).not.toBeCloseTo(errado, 2);
  });
  it("idempotência: cadastrar líquida com ef=100 dá mesmo resultado", () => {
    const liquida: MaquinaCap = { ...SEED, kg_por_hora: 21.25, eficiencia_alvo_pct: 100 };
    expect(capacidadeKgDia(liquida)).toBeCloseTo(capacidadeKgDia(SEED), 4);
  });
});

describe("proximaDataProdutiva — janela produtiva válida (Gantt/CRP)", () => {
  it("pula dias indisponíveis (feriado)", () => {
    const inicio = new Date("2026-07-13T00:00:00Z"); // segunda
    const feriados = new Set(["2026-07-15"]);
    const fim = proximaDataProdutiva(inicio, 3, feriados);
    // 13, 14, (15 feriado pulado), 16 → conclui em 16/07
    expect(fim.toISOString().slice(0, 10)).toBe("2026-07-16");
  });
  it("sem dias indisponíveis, N dias avançam N-1 dias no calendário", () => {
    const inicio = new Date("2026-07-13T00:00:00Z");
    const fim = proximaDataProdutiva(inicio, 2, new Set());
    expect(fim.toISOString().slice(0, 10)).toBe("2026-07-14");
  });
});
