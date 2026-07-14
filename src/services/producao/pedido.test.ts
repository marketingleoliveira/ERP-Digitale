import { describe, it, expect } from "vitest";
import { derivarStatusPedido } from "./pedido.functions";

describe("derivarStatusPedido", () => {
  it("mantém rascunho/aprovado/cancelado", () => {
    for (const s of ["rascunho","aguardando_aprovacao","aprovado","cancelado"] as const) {
      expect(derivarStatusPedido({ atual: s, ops: [], notas: [], expedicoes: [] })).toBe(s);
    }
  });
  it("confirmado sem OP → confirmado", () => {
    expect(derivarStatusPedido({ atual: "confirmado", ops: [], notas: [], expedicoes: [] })).toBe("confirmado");
  });
  it("OPs mistas → parcialmente_produzido", () => {
    expect(derivarStatusPedido({
      atual: "confirmado",
      ops: [{ status: "encerrada" }, { status: "em_producao" }],
      notas: [], expedicoes: [],
    })).toBe("parcialmente_produzido");
  });
  it("todas OPs prontas → pronto_faturamento", () => {
    expect(derivarStatusPedido({
      atual: "confirmado",
      ops: [{ status: "pronta_faturamento" }, { status: "pronta_estoque" }],
      notas: [], expedicoes: [],
    })).toBe("pronto_faturamento");
  });
  it("todas OPs faturadas com NF-e autorizada → faturado", () => {
    expect(derivarStatusPedido({
      atual: "confirmado",
      ops: [{ status: "faturada" }, { status: "faturada" }],
      notas: [{ status_sefaz: "autorizada" }, { status_sefaz: "autorizada" }],
      expedicoes: [],
    })).toBe("faturado");
  });
  it("expedição saiu → expedido", () => {
    expect(derivarStatusPedido({
      atual: "confirmado",
      ops: [{ status: "faturada" }], notas: [], expedicoes: [{ status: "saiu" }],
    })).toBe("expedido");
  });
  it("expedições entregues → entregue", () => {
    expect(derivarStatusPedido({
      atual: "confirmado",
      ops: [{ status: "expedida" }], notas: [], expedicoes: [{ status: "entregue" }],
    })).toBe("entregue");
  });
});
