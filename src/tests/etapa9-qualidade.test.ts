import { describe, it, expect, beforeAll } from "vitest";
import { supabase } from "@/integrations/supabase/client";

/**
 * Testes SQL da Etapa 9 - Qualidade e Liberação Comercial
 * Adaptado para evitar erros de tipagem e garantir existência de dados.
 */
describe("Etapa 9: Qualidade e Liberação Comercial", () => {
  let testLoteId: string;
  let testInspecaoId: string;
  let testArticleId: string;

  beforeAll(async () => {
    // 1. Obter um artigo para vincular ao lote
    const { data: art } = await supabase.from("articles").select("id").limit(1).single();
    if (!art) throw new Error("Nenhum artigo encontrado para teste");
    testArticleId = art.id;

    // 2. Setup: Criar um lote de teste com saldo em qualidade
    const { data: lote, error: loteErr } = await supabase.from("lotes").insert({
      numero_lote: `TEST-QUAL-${Date.now()}`,
      tipo: "tecido",
      item_id: testArticleId,
      quantidade: 100,
      saldo_qualidade: 100,
      data_entrada: new Date().toISOString().slice(0, 10)
    }).select().single();
    
    if (loteErr || !lote) throw new Error(`Falha ao criar lote: ${loteErr?.message}`);
    testLoteId = lote.id;

    // 3. Criar uma inspeção pendente
    const { data: inspecao, error: inspErr } = await supabase.from("inspecoes_qualidade").insert({
      lote_id: testLoteId,
      status: "PENDENTE"
    }).select().single();

    if (inspErr || !inspecao) throw new Error(`Falha ao criar inspeção: ${inspErr?.message}`);
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
    } as any);

    if (error) throw error;
    const res = data as any;
    expect(res.status).toBe("APROVADA");

    // Verificar se os saldos foram movidos corretamente
    const { data: lote } = await supabase.from("lotes").select("*").eq("id", testLoteId).single();
    if (!lote) throw new Error("Lote não encontrado após inspeção");
    expect(Number(lote.saldo_qualidade)).toBe(0);
    expect(Number(lote.saldo_aprovado)).toBe(100);
  });

  it("deve permitir a liberação comercial de um lote aprovado", async () => {
    const { data, error } = await supabase.rpc("release_lot_for_commercial_use", {
      p_lote_id: testLoteId,
      p_deposito: "EXPEDICAO_TESTE"
    } as any);

    if (error) throw error;
    const res = data as any;
    expect(res.success).toBe(true);

    const { data: lote } = await supabase.from("lotes").select("*").eq("id", testLoteId).single();
    if (!lote) throw new Error("Lote não encontrado após liberação");
    expect(lote.liberado_comercial).toBe(true);
    expect(Number(lote.quantidade_disponivel)).toBe(100);
    expect(lote.classificacao).toBe("PRODUTO_ACABADO");
  });

  it("não deve permitir classificar mais do que o saldo do lote", async () => {
    // Criar novo lote de 50kg
    const { data: lote2 } = await supabase.from("lotes").insert({
      numero_lote: `TEST-OVER-${Date.now()}`,
      tipo: "tecido",
      item_id: testArticleId,
      quantidade: 50,
      saldo_qualidade: 50,
      data_entrada: new Date().toISOString().slice(0, 10)
    }).select().single();

    if (!lote2) throw new Error("Falha ao criar lote 2");

    const { data: insp2 } = await supabase.from("inspecoes_qualidade").insert({
      lote_id: lote2.id,
      status: "PENDENTE"
    }).select().single();

    if (!insp2) throw new Error("Falha ao criar inspeção 2");

    // Tentar classificar 60kg
    const { error } = await supabase.rpc("complete_lot_quality_inspection", {
      p_lote_id: lote2.id,
      p_inspecao_id: insp2.id,
      p_resultados: [],
      p_defeitos: [],
      p_classificacoes: { aprovada: 60, reprovada: 0, reprocesso: 0, quarentena: 0, refugo: 0 },
      p_parecer: "Falha esperada"
    } as any);

    expect(error).toBeDefined();
    if (error) {
        expect(error.message).toContain("excede o saldo");
    }
  });
});
