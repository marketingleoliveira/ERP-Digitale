/**
 * Cálculo de duração e capacidade produtiva.
 *
 * Convenção do schema (documentar na UI):
 *   `maquina_capacidade.kg_por_hora`      = capacidade NOMINAL (bruta) em kg/h
 *   `maquina_capacidade.eficiencia_alvo_pct` = % de eficiência esperada
 *
 * A eficiência é aplicada UMA ÚNICA VEZ nesta função.
 * Se a capacidade cadastrada já for líquida, deixe eficiência = 100.
 */
export type MaquinaCap = {
  kg_por_hora: number;         // nominal
  horas_por_turno: number;
  turnos_por_dia: number;
  eficiencia_alvo_pct: number; // 0-100
};

export function capacidadeEfetivaHora(c: MaquinaCap): number {
  return c.kg_por_hora * (c.eficiencia_alvo_pct / 100);
}

export function capacidadeKgDia(c: MaquinaCap): number {
  return capacidadeEfetivaHora(c) * c.horas_por_turno * c.turnos_por_dia;
}

export function duracaoHoras(quantidadeKg: number, kgHoraEfetivoTotal: number): number | null {
  return kgHoraEfetivoTotal > 0 ? quantidadeKg / kgHoraEfetivoTotal : null;
}

export function turnosNecessarios(quantidadeKg: number, c: MaquinaCap): number | null {
  const kgTurno = capacidadeEfetivaHora(c) * c.horas_por_turno;
  return kgTurno > 0 ? quantidadeKg / kgTurno : null;
}
