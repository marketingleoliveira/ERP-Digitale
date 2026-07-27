import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { focusAdapter, FocusConfig } from "@/services/fiscal/focus.adapter";
import { decryptToken } from "@/services/fiscal/encryption.server";

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
    .select("focus_nfe_token, focus_nfe_token_ciphertext, focus_nfe_token_iv, focus_nfe_token_encryption_version, ambiente_nfe")
    .limit(1)
    .single();

  if (error || (!empresa?.focus_nfe_token && !empresa?.focus_nfe_token_ciphertext)) {
    throw new Error("Configuração Focus NFe não encontrada ou incompleta.");
  }

  let token = empresa.focus_nfe_token;
  if (empresa.focus_nfe_token_ciphertext && empresa.focus_nfe_token_iv) {
    token = await decryptToken(
      empresa.focus_nfe_token_ciphertext,
      empresa.focus_nfe_token_iv,
      empresa.focus_nfe_token_encryption_version
    );
  }

  if (!token) throw new Error("Credencial Focus NFe não disponível após descriptografia.");

  return {
    token,
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
      ...(pre.payload_fiscal as Record<string, any>),
      referencia: data.referencia,
      data_emissao: new Date().toISOString(),
      presenca_comprador: 1,
      modalidade_frete: 9,
    };

    const response = await focusAdapter.emitir(config, data.referencia, payload);

    await supabase.rpc('log_nfe_event', {
      _acao: "envio_nfe",
      _http_status: response.status,
      _request: payload as any,
      _response: response.body as any,
      _user_id: userId
    });

    return {
      status: response.status,
      body: response.body as Record<string, any>,
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

    await supabase.rpc('log_nfe_event', {
      _acao: "consulta_nfe",
      _http_status: response.status,
      _request: { referencia: data.referencia },
      _response: response.body as any,
      _user_id: userId
    });

    return response.body as Record<string, any>;
  });
