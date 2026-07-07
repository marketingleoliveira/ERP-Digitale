/**
 * Server functions do módulo de Certificados Digitais A1.
 * Preparação para a comunicação SEFAZ (Fase 1a). Não transmite XML ainda.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STORAGE_BUCKET = "fiscal";
const STORAGE_PREFIX = "certificados";

/* ==================== UPLOAD ==================== */
export const uploadCertificado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        nome: z.string().trim().min(3).max(120),
        senha: z.string().min(1).max(200),
        pfxBase64: z.string().min(100),
        empresaId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { parsePfx, encryptSenha } = await import("./certificado.server");

    // 1. Valida senha + extrai metadados
    let info;
    try {
      info = parsePfx(data.pfxBase64, data.senha);
    } catch {
      throw new Error("Senha inválida ou arquivo PFX corrompido.");
    }
    if (info.validoAte.getTime() < Date.now()) {
      throw new Error("Certificado já está expirado.");
    }

    // 2. Upload do arquivo PFX no bucket privado `fiscal`
    const certId = crypto.randomUUID();
    const path = `${STORAGE_PREFIX}/${certId}.pfx`;
    const pfxBytes = Uint8Array.from(atob(data.pfxBase64), (c) => c.charCodeAt(0));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, pfxBytes, { contentType: "application/x-pkcs12", upsert: false });
    if (up.error) throw new Error(`Falha no upload: ${up.error.message}`);

    // 3. Cifra senha
    const { cifrada, iv } = await encryptSenha(data.senha);

    // 4. Persiste
    const { data: row, error } = await supabase
      .from("certificados_digitais" as never)
      .insert({
        id: certId,
        empresa_id: data.empresaId ?? null,
        nome: data.nome,
        cnpj: info.cnpj,
        pfx_storage_path: path,
        senha_cifrada: cifrada,
        senha_iv: iv,
        valido_de: info.validoDe.toISOString(),
        valido_ate: info.validoAte.toISOString(),
        ativo: false,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) {
      // rollback do arquivo
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);
      throw new Error(error.message);
    }

    return {
      ok: true as const,
      certificado: {
        id: certId,
        nome: data.nome,
        cnpj: info.cnpj,
        titular: info.titular,
        emissor: info.emissor,
        valido_de: info.validoDe.toISOString(),
        valido_ate: info.validoAte.toISOString(),
      },
    };
  });

/* ==================== LISTAR ==================== */
type CertRow = {
  id: string; nome: string; cnpj: string;
  valido_de: string; valido_ate: string; ativo: boolean;
  pfx_storage_path: string; created_at: string; empresa_id: string | null;
};
export const listarCertificados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("certificados_digitais" as never)
      .select("id, nome, cnpj, valido_de, valido_ate, ativo, pfx_storage_path, created_at, empresa_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { certificados: (data ?? []) as unknown as CertRow[] };
  });

/* ==================== ATIVAR ==================== */
export const ativarCertificado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: alvo, error: e1 } = await sb
      .from("certificados_digitais" as never)
      .select("id, empresa_id, valido_ate")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!alvo) throw new Error("Certificado não encontrado.");
    const alvoRec = alvo as Record<string, unknown>;

    if (new Date(String(alvoRec.valido_ate)).getTime() < Date.now()) {
      throw new Error("Certificado expirado não pode ser ativado.");
    }

    // desativa os outros da mesma empresa (índice único garante consistência)
    const desativar = sb.from("certificados_digitais" as never).update({ ativo: false } as never);
    const q = alvoRec.empresa_id
      ? desativar.eq("empresa_id", alvoRec.empresa_id as string)
      : desativar.is("empresa_id", null);
    const { error: e2 } = await q.neq("id", data.id);
    if (e2) throw new Error(e2.message);

    const { error: e3 } = await sb
      .from("certificados_digitais" as never)
      .update({ ativo: true } as never)
      .eq("id", data.id);
    if (e3) throw new Error(e3.message);

    return { ok: true as const };
  });

/* ==================== REMOVER ==================== */
export const removerCertificado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: cert, error } = await context.supabase
      .from("certificados_digitais" as never)
      .select("pfx_storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cert) throw new Error("Certificado não encontrado.");
    const path = (cert as Record<string, unknown>).pfx_storage_path as string;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);

    const { error: dErr } = await context.supabase
      .from("certificados_digitais" as never)
      .delete()
      .eq("id", data.id);
    if (dErr) throw new Error(dErr.message);
    return { ok: true as const };
  });
