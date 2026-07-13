import { describe, it, expect } from "vitest";
import { normalizeRefTipo, assertRefTipo, isRefTipo, REF_TIPOS } from "./ref-tipo";

describe("ref-tipo", () => {
  it("aceita os três valores canônicos em lowercase", () => {
    for (const t of REF_TIPOS) {
      expect(normalizeRefTipo(t)).toBe(t);
      expect(isRefTipo(t)).toBe(true);
    }
  });

  it("normaliza registros legados em UPPERCASE / MixedCase", () => {
    expect(normalizeRefTipo("FIO")).toBe("fio");
    expect(normalizeRefTipo("Produto")).toBe("produto");
    expect(normalizeRefTipo("  VARIANTE  ")).toBe("variante");
  });

  it("rejeita valores fora do conjunto permitido", () => {
    expect(normalizeRefTipo("componente")).toBeNull();
    expect(normalizeRefTipo("")).toBeNull();
    expect(normalizeRefTipo(null)).toBeNull();
    expect(normalizeRefTipo(42)).toBeNull();
    expect(isRefTipo("tecido")).toBe(false);
  });

  it("assertRefTipo lança para valor inválido", () => {
    expect(() => assertRefTipo("xyz")).toThrow(/ref_tipo inválido/);
    expect(assertRefTipo("FIO")).toBe("fio");
  });
});
