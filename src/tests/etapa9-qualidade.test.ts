import { describe, it, expect, beforeAll } from "vitest";
import { supabase } from "@/integrations/supabase/client";

/**
 * Testes SQL da Etapa 9 - Qualidade e Liberação Comercial
 */
describe("Etapa 9: Qualidade e Liberação Comercial", () => {
  let testLoteId: string;
  let testInspecaoId: string;
  let testPlanoId: string;

  beforeAll(async () => {
    // Setup: Criar um lote de teste com saldo em qualidade
    const { data: lote } = await supabase.from("lotes").insert({
      numero_lote: "TEST-QUAL-001",
      tipo: "tecido",
      quantidade: 100,
      saldo_qualidade: 100,
      data_entrada: new Date().toISOString().slice(0, 10)
    }).select().single();
    
    testLoteId = lote.id;

    // Criar um plano de inspeção
    const { data: plano } = await supabase.from("qualidade_planos").insert({
      nome: "Plano de Teste Vitest",
      versao: 999
    }).select().single();
    
    testPlanoId = plano.id;

    // Criar uma inspeção pendente
    const { data: inspecao } = await supabase.from("inspecoes_qualidade").insert({
      lote_id: testLoteId,
      status: "PENDENTE"
    }).select().single();

    testInspecaoId = inspecao.id;
  });

  it("deve permitir concluir uma inspeção aprovada integralmente", async () => {
    const { data, error } = await supabase.rpc("complete_lot_quality_inspection", {
      p_lote_id: testLoteId,
      p_inspecao_id: testInspecaoId,
      p_resultados: [],
      p_defeitos: [],
      p_classificacoes: { aprovada: 100, reprovada: 0, reprocesso: 0, quarentena: 0, refugo: 0 },
      p_parecer: "Aprovado em teste automatizado"
    });

    if (error) throw error;
    expect(data.status).toBe("APROVADA");

    // Verificar se os saldos foram movidos corretamente
    const { data: lote } = await supabase.from("lotes").select("*").eq("id", testLoteId).single();
    expect(Number(lote.saldo_qualidade)).toBe(0);
    expect(Number(lote.saldo_aprovado)).toBe(100);
  });

  it("deve permitir a liberação comercial de um lote aprovado", async () => {
    const { data, error } = await supabase.rpc("release_lot_for_commercial_use", {
      p_lote_id: testLoteId,
      p_deposito: "EXPEDICAO_TESTE"
    });

    if (error) throw error;
    expect(data.success).toBe(true);

    const { data: lote } = await supabase.from("lotes").select("*").eq("id", testLoteId).single();
    expect(lote.liberado_comercial).toBe(true);
    expect(Number(lote.quantidade_disponivel)).toBe(100);
    expect(lote.classificacao).toBe("PRODUTO_ACABADO");
  });

  it("não deve permitir classificar mais do que o saldo do lote", async () => {
    // Criar novo lote de 50kg
    const { data: lote2 } = await supabase.from("lotes").insert({
      numero_lote: "TEST-OVER-001",
      tipo: "tecido",
      quantidade: 50,
      saldo_qualidade: 50,
      data_entrada: new Date().toISOString().slice(0, 10)
    }).select().single();

    const { data: insp2 } = await supabase.from("inspecoes_qualidade").insert({
      lote_id: lote2.id,
      status: "PENDENTE"
    }).select().single();

    // Tentar classificar 60kg
    const { error } = await supabase.rpc("complete_lot_quality_inspection", {
      p_lote_id: lote2.id,
      p_inspecao_id: insp2.id,
      p_resultados: [],
      p_defeitos: [],
      p_classificacoes: { aprovada: 60, reprovada: 0, reprocesso: 0, quarentena: 0, refugo: 0 },
      p_parecer: "Falha esperada"
    });

    expect(error).toBeDefined();
    expect(error.message).toContain("excede o saldo");
  });
});
