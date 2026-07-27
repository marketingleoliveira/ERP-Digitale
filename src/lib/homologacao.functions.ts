import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { focusAdapter, FocusConfig } from "./focus.adapter";

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
 * Esta função realiza o envio real e registra o log.
 */
export const emitirNfeHomologacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => emissaoNfeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Obter Pré-faturamento e dados para o payload
    const { data: pre, error: preErr } = await supabase
      .from("pre_faturamentos")
      .select("*, pre_faturamento_itens(*)")
      .eq("id", data.preFaturamentoId)
      .single();

    if (preErr || !pre) throw new Error("Pré-faturamento não encontrado.");

    // 2. Obter configuração do ambiente
    const config = await getFocusConfig(supabase);

    // 3. Preparar payload para Focus NFe (Simplificado para o teste inicial)
    // Em uma implementação real, o payload_fiscal do banco já estaria estruturado
    const payload = {
      ...pre.payload_fiscal,
      referencia: data.referencia,
      data_emissao: new Date().toISOString(),
      presenca_comprador: 1, // Operação presencial
      modalidade_frete: 9, // Sem frete
    };

    // 4. Envio Real via Adapter
    const response = await focusAdapter.emitir(config, data.referencia, payload);

    // 5. Registrar Log Fiscal
    const { error: logErr } = await supabase.from("nfe_logs").insert({
      nota_fiscal_id: null, // Ainda não temos a nota persistida localmente no primeiro envio
      evento: "envio_nfe",
      status_http: response.status,
      payload_envio: payload,
      payload_retorno: response.body,
      sucesso: response.ok,
      ambiente: config.ambiente,
      referencia_externa: data.referencia,
      user_id: userId
    });

    if (logErr) console.error("Erro ao gravar log fiscal:", logErr);

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
      evento: "consulta_nfe",
      status_http: response.status,
      payload_retorno: response.body,
      sucesso: response.ok,
      ambiente: config.ambiente,
      referencia_externa: data.referencia,
      user_id: userId
    });

    return response.body;
  });
