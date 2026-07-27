import { describe, it, expect } from "vitest";
import { ExplodeBomItem } from "../lib/bom-explosion";

/**
 * Funções utilitárias de transformação baseadas na lógica de src/routes/_app.producao.bom.tsx
 * para testar sem depender da rede no teste unitário de lógica.
 */

function consolidateData(explosion: ExplodeBomItem[]) {
  const map = new Map<string, ExplodeBomItem & { total_liq: number; total_bru: number }>();
  explosion.forEach(item => {
    const key = `${item.component_ref_id}-${item.component_ref_tipo}`;
    const existing = map.get(key);
    if (existing) {
      existing.total_liq += Number(item.quantidade_liquida);
      existing.total_bru += Number(item.quantidade_bruta);
    } else {
      map.set(key, { 
        ...item, 
        total_liq: Number(item.quantidade_liquida), 
        total_bru: Number(item.quantidade_bruta) 
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => (a.codigo || "").localeCompare(b.codigo || ""));
}

describe("ERP BOM Logic - Multi-level Explosion & Consolidation", () => {
  
  it("Deve agrupar corretamente componentes repetidos na consolidação", () => {
    const mockExplosion: ExplodeBomItem[] = [
      {
        article_id: "A",
        component_id: "C1",
        component_ref_id: "PART-1",
        component_ref_tipo: "artigo",
        component_descricao: "Parafuso M8",
        unidade: "UN",
        quantidade_liquida: 10,
        quantidade_bruta: 11,
        nivel: 1
      },
      {
        article_id: "A",
        component_id: "C2",
        component_ref_id: "PART-1",
        component_ref_tipo: "artigo",
        component_descricao: "Parafuso M8",
        unidade: "UN",
        quantidade_liquida: 5,
        quantidade_bruta: 5.5,
        nivel: 2
      }
    ];

    const consolidated = consolidateData(mockExplosion);

    expect(consolidated).toHaveLength(1);
    expect(consolidated[0].total_liq).toBe(15);
    expect(consolidated[0].total_bru).toBe(16.5);
  });

  it("Deve manter a hierarquia de níveis intacta", () => {
    const mockExplosion: ExplodeBomItem[] = [
      { article_id: "A", component_id: "C1", component_ref_id: "S1", component_ref_tipo: "artigo", component_descricao: "Sub", unidade: "UN", quantidade_liquida: 1, quantidade_bruta: 1, nivel: 1 },
      { article_id: "A", component_id: "C2", component_ref_id: "P1", component_ref_tipo: "artigo", component_descricao: "Part", unidade: "UN", quantidade_liquida: 10, quantidade_bruta: 10, nivel: 2 }
    ];
    
    expect(mockExplosion[0].nivel).toBe(1);
    expect(mockExplosion[1].nivel).toBe(2);
  });

  it("Deve somar corretamente quantidades em múltiplos níveis", () => {
     const mockExplosion: ExplodeBomItem[] = [
      { article_id: "A", component_id: "C1", component_ref_id: "X", component_ref_tipo: "artigo", component_descricao: "X", unidade: "UN", quantidade_liquida: 1.2555, quantidade_bruta: 1.3000, nivel: 1 },
      { article_id: "A", component_id: "C2", component_ref_id: "X", component_ref_tipo: "artigo", component_descricao: "X", unidade: "UN", quantidade_liquida: 2.0000, quantidade_bruta: 2.1000, nivel: 3 }
    ];

    const consolidated = consolidateData(mockExplosion);
    expect(consolidated[0].total_liq).toBeCloseTo(3.2555, 4);
    expect(consolidated[0].total_bru).toBeCloseTo(3.4000, 4);
  });

  it("Deve tratar perdas acumuladas corretamente em múltiplos níveis", () => {
    // Simulação: A -> B (perda 10%) -> C (perda 10%)
    const mockExplosion: ExplodeBomItem[] = [
      { article_id: "A", component_id: "B", component_ref_id: "B", component_ref_tipo: "artigo", component_descricao: "B", unidade: "UN", quantidade_liquida: 1, quantidade_bruta: 1.1, nivel: 1 },
      { article_id: "A", component_id: "C", component_ref_id: "C", component_ref_tipo: "artigo", component_descricao: "C", unidade: "UN", quantidade_liquida: 1, quantidade_bruta: 1.21, nivel: 2 }
    ];
    
    const consolidated = consolidateData(mockExplosion);
    const itemC = consolidated.find(i => i.component_ref_id === "C");
    expect(itemC?.total_bru).toBe(1.21);
  });

});
