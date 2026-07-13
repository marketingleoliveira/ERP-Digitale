/**
 * Tipagem central de `article_bom.ref_tipo`.
 * O banco aceita EXCLUSIVAMENTE estes três valores em lowercase
 * (constraint: ref_tipo IN ('fio','produto','variante')).
 * Toda leitura/gravação DEVE passar por `normalizeRefTipo`.
 */
export const REF_TIPOS = ["fio", "produto", "variante"] as const;
export type RefTipo = (typeof REF_TIPOS)[number];

export function isRefTipo(v: unknown): v is RefTipo {
  return typeof v === "string" && (REF_TIPOS as readonly string[]).includes(v.toLowerCase());
}

/**
 * Normaliza qualquer entrada para lowercase válido.
 * Retorna `null` se o valor não for um dos três permitidos.
 * Registros legados em UPPERCASE são aceitos e convertidos.
 */
export function normalizeRefTipo(v: unknown): RefTipo | null {
  if (typeof v !== "string") return null;
  const low = v.trim().toLowerCase();
  return (REF_TIPOS as readonly string[]).includes(low) ? (low as RefTipo) : null;
}

/**
 * Versão estrita: lança se inválido. Use em gravações/inserts.
 */
export function assertRefTipo(v: unknown): RefTipo {
  const r = normalizeRefTipo(v);
  if (!r) throw new Error(`ref_tipo inválido: ${String(v)} (esperado: ${REF_TIPOS.join("|")})`);
  return r;
}
