/**
 * Server-only: parse PFX (PKCS#12) + AES-GCM encrypt/decrypt.
 * NUNCA importar deste arquivo em código de client. O sufixo `.server.ts`
 * é bloqueado no bundle do browser.
 */
import forge from "node-forge";

export type PfxInfo = {
  titular: string;
  cnpj: string;
  emissor: string;
  validoDe: Date;
  validoAte: Date;
};

/** Extrai metadados de um PFX validando a senha. Lança se inválido. */
export function parsePfx(pfxBase64: string, senha: string): PfxInfo {
  const der = forge.util.decode64(pfxBase64);
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, senha);

  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = bags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error("Certificado não encontrado no PFX.");
  const cert = certBag.cert;

  const cnAttr = cert.subject.getField("CN");
  const cn = String(cnAttr?.value ?? "");
  // CN típico: "NOME DA EMPRESA:12345678000199"
  const cnMatch = cn.match(/^(.+?):(\d{11,14})$/);
  const titular = cnMatch ? cnMatch[1].trim() : cn;
  const cnpj = cnMatch ? cnMatch[2] : "";

  const issuerCn = cert.issuer.getField("CN");
  const emissor = String(issuerCn?.value ?? "Desconhecido");

  return {
    titular,
    cnpj,
    emissor,
    validoDe: cert.validity.notBefore,
    validoAte: cert.validity.notAfter,
  };
}

/** Deriva uma chave AES-256 a partir do secret CERT_ENC_KEY. */
async function deriveKey(): Promise<CryptoKey> {
  const secret = process.env.CERT_ENC_KEY;
  if (!secret) throw new Error("CERT_ENC_KEY não configurado.");
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptSenha(plain: string): Promise<{ cifrada: string; iv: string }> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  return {
    cifrada: btoa(String.fromCharCode(...new Uint8Array(ct))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptSenha(cifrada: string, iv: string): Promise<string> {
  const key = await deriveKey();
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const ctBytes = Uint8Array.from(atob(cifrada), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, ctBytes);
  return new TextDecoder().decode(pt);
}
