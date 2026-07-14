/**
 * FONTE ÚNICA DE VERDADE — cálculo de capacidade produtiva.
 *
 * Consumido por: MRP (mrp.functions.ts), Sugestão de OP (mrp-op.functions.ts),
 * CRP (a implementar), Gantt (a implementar), Dashboard Industrial
 * (via view `vw_capacidade_semanal`, cujas colunas espelham estas fórmulas).
 *
 * Convenção do schema (documentar sempre na UI):
 *   `maquina_capacidade.kg_por_hora`        = capacidade NOMINAL (bruta) em kg/h
 *   `maquina_capacidade.horas_por_turno`    = horas produtivas por turno
 *   `maquina_capacidade.turnos_por_dia`     = turnos operacionais por dia
 *   `maquina_capacidade.dias_uteis_semana`  = dias úteis padrão
 *   `maquina_capacidade.eficiencia_alvo_pct` = % de eficiência (0–100)
 *
 * REGRAS INVIOLÁVEIS:
 *   1. Eficiência é aplicada UMA ÚNICA vez em `capacidadeEfetivaHora`.
 *      Se a kg/h cadastrada já for líquida, cadastrar eficiência = 100.
 *   2. NUNCA dividir duração por 24 para estimar dias — usar `diasProdutivos`.
 *   3. Datas de conclusão devem consumir apenas janelas produtivas válidas
 *      (calendário produtivo, feriados, paradas). Ver `proximaDataProdutiva`.
 *   4. Nenhum componente React deve recomputar estas fórmulas localmente;
 *      importar sempre daqui.
 */
export type MaquinaCap = {
  kg_por_hora: number;         // nominal
  horas_por_turno: number;
  turnos_por_dia: number;
  eficiencia_alvo_pct: number; // 0-100
};

/** kg/h efetivos = nominal × eficiência. */
export function capacidadeEfetivaHora(c: MaquinaCap): number {
  return c.kg_por_hora * (c.eficiencia_alvo_pct / 100);
}

/** kg/dia efetivos = efetiva/h × horas/turno × turnos/dia. */
export function capacidadeKgDia(c: MaquinaCap): number {
  return capacidadeEfetivaHora(c) * c.horas_por_turno * c.turnos_por_dia;
}

/** kg/semana efetivos — usado pelo Dashboard Industrial (view SQL espelha esta fórmula). */
export function capacidadeKgSemana(c: MaquinaCap, diasUteisSemana: number): number {
  return capacidadeKgDia(c) * diasUteisSemana;
}

/** Duração em horas produtivas para uma quantidade em kg. */
export function duracaoHoras(quantidadeKg: number, kgHoraEfetivoTotal: number): number | null {
  return kgHoraEfetivoTotal > 0 ? quantidadeKg / kgHoraEfetivoTotal : null;
}

/** Turnos necessários (fração de turnos de 8h ou similar). */
export function turnosNecessarios(quantidadeKg: number, c: MaquinaCap): number | null {
  const kgTurno = capacidadeEfetivaHora(c) * c.horas_por_turno;
  return kgTurno > 0 ? quantidadeKg / kgTurno : null;
}

/**
 * Dias produtivos necessários. NÃO usar `duracaoH / 24`.
 * Usa capacidade diária real (jornada × turnos × eficiência).
 */
export function diasProdutivos(quantidadeKg: number, capKgDia: number): number | null {
  return capKgDia > 0 ? quantidadeKg / capKgDia : null;
}

/**
 * Contrato para Gantt / CRP (a implementar): dada uma data-início e um número
 * de dias produtivos, retorna a data prevista de conclusão consumindo apenas
 * dias marcados como "util" no calendário. Feriados, paradas e domingos são
 * pulados. Recebe o conjunto de datas indisponíveis (ISO yyyy-mm-dd).
 */
export function proximaDataProdutiva(
  inicio: Date,
  diasNecessarios: number,
  diasIndisponiveis: ReadonlySet<string>,
): Date {
  if (diasNecessarios <= 0) return new Date(inicio);
  let restante = diasNecessarios;
  const cursor = new Date(inicio);
  // consome dias inteiros; o último dia pode ser fracionário (ok — data marca conclusão)
  while (restante > 0) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!diasIndisponiveis.has(iso)) {
      restante -= 1;
    }
    if (restante > 0) cursor.setDate(cursor.getDate() + 1);
  }
  return cursor;
}
