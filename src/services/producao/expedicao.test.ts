import { describe, it, expect } from "vitest";

/**
 * Testes lógicos do módulo de Expedição.
 *
 * As regras críticas (bloqueio sem NF autorizada, saldo do lote,
 * matriz de transição, override admin) estão implementadas em
 * funções SQL (`exp_transicionar`, `exp_separar_lote`) e são validadas
 * no banco. Aqui testamos a matriz de transição em espelho JS.
 */

type S = "aguardando" | "em_separacao" | "separado" | "em_conferencia"
  | "conferido" | "expedido" | "em_transito" | "entregue" | "ocorrencia" | "devolvido";

function transicaoValida(atual: S, novo: S): boolean {
  const map: Record<S, S[]> = {
    aguardando: ["em_separacao", "ocorrencia"],
    em_separacao: ["separado", "ocorrencia"],
    separado: ["em_conferencia", "ocorrencia"],
    em_conferencia: ["conferido", "ocorrencia", "em_separacao"],
    conferido: ["expedido", "ocorrencia"],
    expedido: ["em_transito", "entregue", "ocorrencia"],
    em_transito: ["entregue", "ocorrencia", "devolvido"],
    entregue: ["devolvido", "ocorrencia"],
    ocorrencia: ["em_separacao", "em_transito", "entregue", "devolvido"],
    devolvido: [],
  };
  return map[atual].includes(novo);
}

describe("expedição — matriz de transição", () => {
  it("aguardando → em_separacao", () => {
    expect(transicaoValida("aguardando", "em_separacao")).toBe(true);
  });
  it("bloqueia salto aguardando → expedido", () => {
    expect(transicaoValida("aguardando", "expedido")).toBe(false);
  });
  it("fluxo feliz completo", () => {
    const seq: S[] = ["aguardando","em_separacao","separado","em_conferencia","conferido","expedido","em_transito","entregue"];
    for (let i = 0; i < seq.length - 1; i++) {
      expect(transicaoValida(seq[i], seq[i + 1])).toBe(true);
    }
  });
  it("ocorrência é sempre alcançável durante o fluxo", () => {
    for (const s of ["aguardando","em_separacao","separado","em_conferencia","conferido","expedido","em_transito"] as S[]) {
      expect(transicaoValida(s, "ocorrencia")).toBe(true);
    }
  });
  it("devolvido é estado final", () => {
    expect(transicaoValida("devolvido", "entregue")).toBe(false);
  });
});

describe("expedição — override admin", () => {
  const overrideValido = (motivo: string | undefined, isAdmin: boolean) =>
    isAdmin && (motivo ?? "").startsWith("OVERRIDE_ADM:");

  it("aceita override apenas com admin + prefixo", () => {
    expect(overrideValido("OVERRIDE_ADM: NF em contingência", true)).toBe(true);
    expect(overrideValido("OVERRIDE_ADM: x", false)).toBe(false);
    expect(overrideValido("motivo qualquer", true)).toBe(false);
    expect(overrideValido(undefined, true)).toBe(false);
  });
});

describe("expedição — separação por lote", () => {
  function podeSeparar(disponivel: number, requisitado: number) {
    return disponivel >= requisitado;
  }
  it("permite quando saldo é suficiente", () => {
    expect(podeSeparar(100, 50)).toBe(true);
  });
  it("bloqueia quando saldo é insuficiente", () => {
    expect(podeSeparar(10, 50)).toBe(false);
  });
});
