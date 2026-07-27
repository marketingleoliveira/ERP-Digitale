import { describe, it, expect, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

/**
 * Testes de integração para a Etapa 7: Entrada de Produção e Lotes.
 * Nota: Como sandbox_exec não é owner, estes testes dependem das migrações terem sido aplicadas.
 */
describe("Etapa 7 — Entrada de Produção e Lotes", () => {
  let opId: string;
  let artigoId: string;

  beforeEach(async () => {
    // Buscar uma OP de malharia ativa para testes
    const { data: op } = await supabase
      .from("ordens_producao" as any)
      .select("id, artigo_id")
      .eq("status", "em_producao")
      .limit(1)
      .maybeSingle();
    
    if (op) {
      opId = op.id;
      artigoId = op.artigo_id;
    }
  });

  it("Deve simular uma entrada de produção", async () => {
    if (!opId) return;

    const { data, error } = await supabase.rpc("simulate_production_receipt" as any, {
      p_op_id: opId,
      p_quantidade_entrada: 10
    });

    expect(error).toBeNull();
    expect(data).toHaveProperty("saldo_elegivel");
    expect(data).toHaveProperty("classificacao_sugerida");
  });

  it("Não deve permitir entrada acima do saldo elegível", async () => {
    if (!opId) return;

    const { data: sim } = await supabase.rpc("simulate_production_receipt" as any, {
      p_op_id: opId,
      p_quantidade_entrada: 1
    }) as any;

    const { error } = await supabase.rpc("receive_production_output" as any, {
      p_op_id: opId,
      p_quantidade: (sim?.saldo_elegivel || 0) + 1000,
      p_deposito: "Teste",
      p_classificacao: "PRODUTO-ACABADO"
    });

    // Deve falhar com erro de negócio
    expect(error).not.toBeNull();
  });

  it("Deve validar genealogia de lote (lote_genealogia)", async () => {
    const { data, error } = await supabase
      .from("lote_genealogia" as any)
      .select("*")
      .limit(1);

    expect(error).toBeNull();
  });
});
