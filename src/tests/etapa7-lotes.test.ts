import { describe, it, expect, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Etapa 7 — Entrada de Produção e Lotes", () => {
  let opId: string;

  beforeEach(async () => {
    const { data: op } = await supabase
      .from("ordens_producao" as any)
      .select("id")
      .eq("status", "em_producao")
      .limit(1)
      .maybeSingle();
    
    if (op) {
      opId = (op as any).id;
    }
  });

  it("Deve simular uma entrada de produção", async () => {
    if (!opId) return;

    const { data, error } = await supabase.rpc("simulate_production_receipt" as any, {
      p_op_id: opId,
      p_quantidade_entrada: 10
    });

    expect(error).toBeNull();
  });

  it("Deve validar existência da tabela lote_genealogia", async () => {
    const { data, error } = await supabase
      .from("lote_genealogia" as any)
      .select("*")
      .limit(1);

    expect(error).toBeNull();
  });
});
