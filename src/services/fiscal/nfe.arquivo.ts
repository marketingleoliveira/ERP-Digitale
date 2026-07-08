/**
 * Arquivamento legal dos documentos fiscais retornados pela Focus NFe.
 * Baixa XML autorizado + DANFE PDF, salva no bucket `fiscal` e devolve URLs assinadas.
 * Retenção mínima 5 anos (política de expiração do bucket).
 */
import { focusAdapter, type FocusConfig } from "./focus.adapter";

type SupabaseLike = {
  storage: {
    from: (b: string) => {
      upload: (path: string, body: Blob | ArrayBuffer | Uint8Array, opts?: { contentType?: string; upsert?: boolean }) => Promise<{ error: unknown }>;
      createSignedUrl: (path: string, ttl: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
};

const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 dias — renovado sob demanda pela tela da nota
const BUCKET = "fiscal";

async function baixarFocus(cfg: FocusConfig, caminho: string): Promise<ArrayBuffer> {
  const url = `${focusAdapter.baseUrl(cfg)}${caminho}`;
  const auth = "Basic " + Buffer.from(`${cfg.token}:`).toString("base64");
  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) throw new Error(`Falha ao baixar ${caminho} (HTTP ${res.status})`);
  return await res.arrayBuffer();
}

export type ArquivadosPaths = {
  xmlPath: string | null;
  pdfPath: string | null;
  xmlSignedUrl: string | null;
  pdfSignedUrl: string | null;
};

/**
 * Baixa e arquiva XML + DANFE no bucket `fiscal`.
 * Chave NF-e é a base do nome; se ausente, usa o `ref` fornecido pela Focus.
 */
export async function arquivarDocumentosFiscais(
  supabase: SupabaseLike,
  cfg: FocusConfig,
  chaveOuRef: string,
  caminhos: { xml?: string | null; danfe?: string | null }
): Promise<ArquivadosPaths> {
  const base = chaveOuRef.replace(/[^A-Za-z0-9_-]/g, "");
  const out: ArquivadosPaths = { xmlPath: null, pdfPath: null, xmlSignedUrl: null, pdfSignedUrl: null };

  if (caminhos.xml) {
    const buf = await baixarFocus(cfg, caminhos.xml);
    const path = `xml/${base}.xml`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: "application/xml", upsert: true });
    if (error) throw new Error(`Upload XML falhou: ${String((error as { message?: string }).message ?? error)}`);
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
    out.xmlPath = path;
    out.xmlSignedUrl = data?.signedUrl ?? null;
  }

  if (caminhos.danfe) {
    const buf = await baixarFocus(cfg, caminhos.danfe);
    const path = `pdf/${base}.pdf`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: "application/pdf", upsert: true });
    if (error) throw new Error(`Upload DANFE falhou: ${String((error as { message?: string }).message ?? error)}`);
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
    out.pdfPath = path;
    out.pdfSignedUrl = data?.signedUrl ?? null;
  }

  return out;
}
