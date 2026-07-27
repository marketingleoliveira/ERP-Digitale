import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { focusAdapter, FocusConfig } from "@/services/fiscal/focus.adapter";

// Esquema para o envio da NF-e
const emissaoNfeSchema = z.object({
  preFaturamentoId: z.string().uuid(),
  referencia: z.string(),
});

/**
 * Função interna para obter configuração fiscal da empresa
 */
async function getFocusConfig(supabase: any): Promise<FocusConfig> {
  const { data: empresa, error } = await supabase
    .from("empresa")
    .select("focus_nfe_token, ambiente_nfe")
    .limit(1)
    .single();

  if (error || !empresa?.focus_nfe_token) {
    throw new Error("Configuração Focus NFe não encontrada ou incompleta.");
  }

  return {
    token: empresa.focus_nfe_token,
    ambiente: empresa.ambiente_nfe || "homologacao",
  };
}

/**
 * Envia uma NF-e para a Focus NFe em ambiente de homologação.
 */
export const emitirNfeHomologacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => emissaoNfeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: pre, error: preErr } = await supabase
      .from("pre_faturamentos")
      .select("*, pre_faturamento_itens(*)")
      .eq("id", data.preFaturamentoId)
      .single();

    if (preErr || !pre) throw new Error("Pré-faturamento não encontrado.");

    const config = await getFocusConfig(supabase);

    // Payload básico para homologação Focus NFe
    const payload = {
      ...(pre.payload_fiscal as object),
      referencia: data.referencia,
      data_emissao: new Date().toISOString(),
      presenca_comprador: 1,
      modalidade_frete: 9,
    };

    const response = await focusAdapter.emitir(config, data.referencia, payload);

    await supabase.from("nfe_logs").insert({
      nota_fiscal_id: null,
      acao: "envio_nfe",
      http_status: response.status,
      request: payload as any,
      response: response.body as any,
      user_id: userId
    });

    return {
      status: response.status,
      body: response.body,
      ok: response.ok
    };
  });

/**
 * Consulta o status de uma NF-e na Focus NFe.
 */
export const consultarNfeHomologacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ referencia: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const config = await getFocusConfig(supabase);
    
    const response = await focusAdapter.consultar(config, data.referencia);

    await supabase.from("nfe_logs").insert({
      acao: "consulta_nfe",
      http_status: response.status,
      response: response.body as any,
      user_id: userId
    });

    return response.body;
  });
