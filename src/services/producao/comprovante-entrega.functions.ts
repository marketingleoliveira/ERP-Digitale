/**
 * Upload real de comprovante de entrega em bucket privado.
 * Regras:
 * - PDF / JPG / PNG apenas.
 * - Limite 10 MB.
 * - Signed URL de leitura sob demanda (5 min).
 * - RLS por cargo (logistica / gerente / desenvolvedor) já garantida via
 *   políticas em storage.objects (migração).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "entrega-comprovantes";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);

/**
 * Registra metadados do comprovante no evento de entrega. O arquivo em si
 * deve ser enviado pelo cliente diretamente ao Storage (via `supabase.storage
 * .from('entrega-comprovantes').upload(path, file)`) — assim o browser não
 * precisa serializar bytes através do RPC.
 */
export const registrarComprovanteEntrega = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { eventoId: string; path: string; mime: string; size: number }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (!ALLOWED.has(data.mime)) throw new Error(`Tipo não permitido: ${data.mime}`);
    if (data.size <= 0 || data.size > MAX_SIZE) throw new Error(`Tamanho inválido (${data.size} B, máx ${MAX_SIZE} B)`);
    if (!data.path.startsWith("entregas/")) throw new Error("Path fora do prefixo 'entregas/'");

    const { data: row, error } = await supabase
      .from("entrega_eventos")
      .update({
        comprovante_path: data.path,
        comprovante_mime: data.mime,
        comprovante_size: data.size,
      } as never)
      .eq("id", data.eventoId)
      .select("id, romaneio_id, comprovante_path")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, evento: row };
  });

export const getComprovanteEntregaUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { eventoId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: ev, error } = await supabase
      .from("entrega_eventos")
      .select("comprovante_path")
      .eq("id", data.eventoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const path = (ev as { comprovante_path: string | null } | null)?.comprovante_path;
    if (!path) throw new Error("Sem comprovante");
    const { data: signed, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Falha ao gerar URL");
    return { url: signed.signedUrl, expiresIn: 300 };
  });
