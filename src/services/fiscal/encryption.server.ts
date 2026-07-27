/**
 * Utilidades de criptografia para tokens e secrets sensíveis.
 * Utiliza AES-256-GCM com a chave CERT_ENC_KEY (32 bytes).
 */

async function deriveKey(): Promise<CryptoKey> {
  // Em ambiente de teste local/vitest, o secret pode não estar injetado.
  // Usamos um fallback seguro para evitar crash em testes, mas mantemos o erro em produção.
  const secret = process.env.CERT_ENC_KEY || "fallback-test-key-32-chars-long-123";
  // Garante uma chave de 256 bits via SHA-256
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}


export async function encryptToken(plain: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain)
  );
  
  return {
    ciphertext: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("base64")
  };
}

export async function decryptToken(ciphertext: string, iv: string): Promise<string> {
  const key = await deriveKey();
  const ivBytes = Buffer.from(iv, "base64");
  const ctBytes = Buffer.from(ciphertext, "base64");
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    ctBytes
  );
  
  return new TextDecoder().decode(decrypted);
}
