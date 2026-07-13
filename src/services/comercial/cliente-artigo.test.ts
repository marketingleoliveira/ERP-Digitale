import { describe, it, expect } from "vitest";

/**
 * Testes de contrato da resolução de preço Cliente × Artigo.
 * A execução real depende da função SQL `resolver_preco_cliente_artigo`.
 * Aqui validamos a lógica de prioridade documentada.
 */

type Regra = {
  produto_id: string | null;
  variante_id: string | null;
  artigo_id: string;
  preco: number;
};

function resolverLocal(
  regras: Regra[],
  q: { produto_id?: string | null; variante_id?: string | null; artigo_id: string },
): { origem: string; preco: number } | null {
  const ativas = regras;
  if (q.produto_id && q.variante_id) {
    const m = ativas.find(r => r.produto_id === q.produto_id && r.variante_id === q.variante_id);
    if (m) return { origem: "cliente_produto_variante", preco: m.preco };
  }
  if (q.produto_id) {
    const m = ativas.find(r => r.produto_id === q.produto_id && r.variante_id === null);
    if (m) return { origem: "cliente_produto", preco: m.preco };
  }
  const m = ativas.find(r => r.artigo_id === q.artigo_id && r.produto_id === null);
  if (m) return { origem: "cliente_artigo", preco: m.preco };
  return null;
}

describe("resolver_preco_cliente_artigo — prioridade", () => {
  const regras: Regra[] = [
    { produto_id: null, variante_id: null, artigo_id: "A1", preco: 10 },
    { produto_id: "P1", variante_id: null, artigo_id: "A1", preco: 20 },
    { produto_id: "P1", variante_id: "V1", artigo_id: "A1", preco: 30 },
  ];

  it("prefere cliente + produto + variante", () => {
    expect(resolverLocal(regras, { produto_id: "P1", variante_id: "V1", artigo_id: "A1" }))
      .toEqual({ origem: "cliente_produto_variante", preco: 30 });
  });

  it("cai para cliente + produto quando não há variante", () => {
    expect(resolverLocal(regras, { produto_id: "P1", artigo_id: "A1" }))
      .toEqual({ origem: "cliente_produto", preco: 20 });
  });

  it("cai para cliente + artigo quando não há produto", () => {
    expect(resolverLocal(regras, { artigo_id: "A1" }))
      .toEqual({ origem: "cliente_artigo", preco: 10 });
  });

  it("retorna null quando não há regra aplicável", () => {
    expect(resolverLocal(regras, { artigo_id: "A2" })).toBeNull();
  });
});
