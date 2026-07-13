/**
 * Server functions para configuração da Focus NFe pela UI (menu DEV).
 * Persiste token/ambiente/série na tabela `empresa`. Apenas desenvolvedor pode gerenciar.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FocusConfigPayload = {
  provedor_nfe: "focus_nfe" | "nenhum" | "plugnotas";
  ambiente_nfe: "homologacao" | "producao";
  focus_nfe_token: string;
  serie_nfe: number;
  proximo_numero_nfe: number;
};

async function assertDev(context: { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "desenvolvedor",
  });
  if (error) throw new Error(String(error));
  if (!data) throw new Error("Somente cargo Desenvolvedor pode alterar configuração Focus NFe.");
}

/* ==================== LER CONFIG ==================== */
export const getFocusConfigServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDev(context as never);
    const { data, error } = await context.supabase
      .from("empresa")
      .select("id, provedor_nfe, ambiente_nfe, focus_nfe_token, serie_nfe, proximo_numero_nfe, cnpj, razao_social")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const rec = (data as Record<string, unknown> | null) ?? null;
    return {
      exists: Boolean(rec),
      id: (rec?.id as string) ?? null,
      provedor_nfe: (rec?.provedor_nfe as string) ?? "nenhum",
      ambiente_nfe: (rec?.ambiente_nfe as string) ?? "homologacao",
      // Nunca retornar o token bruto para a UI: apenas indicar se está setado
      token_configurado: Boolean(rec?.focus_nfe_token),
      token_preview: rec?.focus_nfe_token
        ? String(rec.focus_nfe_token).slice(0, 4) + "…" + String(rec.focus_nfe_token).slice(-4)
        : "",
      serie_nfe: (rec?.serie_nfe as number) ?? 1,
      proximo_numero_nfe: (rec?.proximo_numero_nfe as number) ?? 1,
      cnpj: (rec?.cnpj as string) ?? "",
      razao_social: (rec?.razao_social as string) ?? "",
      env_token_presente: Boolean(process.env.FOCUS_NFE_TOKEN),
    };
  });

/* ==================== SALVAR CONFIG ==================== */
export const saveFocusConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: Partial<FocusConfigPayload>) => i)
  .handler(async ({ data, context }) => {
    await assertDev(context as never);

    const { data: existing } = await context.supabase
      .from("empresa")
      .select("id")
      .limit(1)
      .maybeSingle();

    const patch: Record<string, unknown> = {};
    if (data.provedor_nfe !== undefined) patch.provedor_nfe = data.provedor_nfe;
    if (data.ambiente_nfe !== undefined) patch.ambiente_nfe = data.ambiente_nfe;
    if (data.serie_nfe !== undefined) patch.serie_nfe = data.serie_nfe;
    if (data.proximo_numero_nfe !== undefined) patch.proximo_numero_nfe = data.proximo_numero_nfe;
    // Token: só grava se veio string não-vazia (permite deixar em branco no form sem apagar)
    if (typeof data.focus_nfe_token === "string" && data.focus_nfe_token.trim().length > 0) {
      patch.focus_nfe_token = data.focus_nfe_token.trim();
    }

    if (existing) {
      const { error } = await context.supabase
        .from("empresa")
        .update(patch as never)
        .eq("id", (existing as Record<string, unknown>).id as string);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("empresa").insert(patch as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

/* ==================== LIMPAR TOKEN ==================== */
export const clearFocusToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDev(context as never);
    const { data: existing } = await context.supabase
      .from("empresa")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (!existing) return { ok: true as const };
    const { error } = await context.supabase
      .from("empresa")
      .update({ focus_nfe_token: null } as never)
      .eq("id", (existing as Record<string, unknown>).id as string);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ==================== TESTAR CONEXÃO ==================== */
export const testFocusConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDev(context as never);
    const { data: emp } = await context.supabase
      .from("empresa")
      .select("focus_nfe_token, ambiente_nfe, cnpj")
      .limit(1)
      .maybeSingle();
    const empRec = (emp as Record<string, unknown> | null) ?? {};
    const token = (empRec.focus_nfe_token as string | null) || process.env.FOCUS_NFE_TOKEN;
    if (!token) return { ok: false as const, mensagem: "Token não configurado." };

    const ambiente = (empRec.ambiente_nfe as string) ?? "homologacao";
    const baseUrl = ambiente === "producao"
      ? "https://api.focusnfe.com.br"
      : "https://homologacao.focusnfe.com.br";
    const cnpj = String(empRec.cnpj ?? "").replace(/\D/g, "");
    if (!cnpj) return { ok: false as const, mensagem: "CNPJ da empresa não configurado." };

    const auth = "Basic " + Buffer.from(`${token}:`).toString("base64");
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/v2/empresas?cnpj=${cnpj}`, {
        headers: { Authorization: auth },
      });
      const durationMs = Date.now() - start;
      const body = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        ambiente,
        durationMs,
        mensagem: res.ok
          ? `Conexão OK (${res.status} em ${durationMs}ms)`
          : `Falha ${res.status}: ${body.slice(0, 200)}`,
      };
    } catch (e) {
      return {
        ok: false as const,
        mensagem: `Erro de rede: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  });
