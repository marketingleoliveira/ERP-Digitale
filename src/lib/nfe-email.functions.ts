/**
 * Envio de NF-e por e-mail (Resend).
 * Requer secret RESEND_API_KEY configurada em Configurações → Secrets.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SendInput = { notaId: string; para: string; assunto?: string; mensagem?: string };

export const enviarNFePorEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: SendInput) => {
    if (!i.notaId) throw new Error("notaId obrigatório.");
    if (!i.para || !/.+@.+\..+/.test(i.para)) throw new Error("E-mail destinatário inválido.");
    return i;
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Secret RESEND_API_KEY não configurada.");

    const { supabase } = context;
    const { data: nota, error } = await supabase
      .from("notas_fiscais").select("numero, serie, chave_acesso, xml_url, danfe_url, status_sefaz")
      .eq("id", data.notaId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!nota) throw new Error("Nota não encontrada.");

    const n = nota as Record<string, unknown>;
    const assunto = data.assunto ?? `NF-e nº ${n.numero ?? ""} — Digitale Têxtil`;
    const links: string[] = [];
    if (n.danfe_url) links.push(`<li><a href="${n.danfe_url}">Baixar DANFE (PDF)</a></li>`);
    if (n.xml_url) links.push(`<li><a href="${n.xml_url}">Baixar XML</a></li>`);
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Nota Fiscal Eletrônica</h2>
        <p>${data.mensagem ?? "Segue a NF-e referente à sua compra."}</p>
        <p><strong>Número:</strong> ${n.numero ?? "-"} / Série ${n.serie ?? "-"}<br/>
        <strong>Chave:</strong> ${n.chave_acesso ?? "-"}<br/>
        <strong>Status:</strong> ${n.status_sefaz ?? "-"}</p>
        ${links.length ? `<ul>${links.join("")}</ul>` : "<p><em>Documentos ainda não disponíveis.</em></p>"}
        <hr/><p style="color:#666;font-size:12px">Digitale Têxtil</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "Digitale Têxtil <onboarding@resend.dev>",
        to: [data.para], subject: assunto, html,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Falha ao enviar: ${JSON.stringify(body)}`);
    return { ok: true as const, id: (body as { id?: string }).id ?? null };
  });
