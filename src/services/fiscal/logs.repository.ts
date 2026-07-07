/**
 * Repositório de logs SEFAZ.
 * Grava toda ida/vinda ao provedor NF-e para auditoria.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type NfeLogInput = {
  notaFiscalId: string | null;
  acao: string;
  request?: unknown;
  response?: unknown;
  httpStatus?: number;
  duracaoMs?: number;
  userId?: string;
};

export async function logNfeAction(
  supabase: SupabaseClient,
  input: NfeLogInput
): Promise<void> {
  try {
    await supabase.from("nfe_logs" as never).insert({
      nota_fiscal_id: input.notaFiscalId,
      acao: input.acao,
      request: input.request ?? null,
      response: input.response ?? null,
      http_status: input.httpStatus ?? null,
      duracao_ms: input.duracaoMs ?? null,
      user_id: input.userId ?? null,
    } as never);
  } catch (e) {
    console.error("[fiscal] log falhou:", e);
  }
}
