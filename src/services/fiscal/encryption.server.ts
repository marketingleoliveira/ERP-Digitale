/**
 * Utilidades de criptografia para tokens e secrets sensíveis.
 * Utiliza AES-256-GCM com a chave CERT_ENC_KEY (32 bytes).
 * O AuthTag é incorporado ao ciphertext (padrão WebCrypto/SubtleCrypto).
 */

async function deriveKey(): Promise<CryptoKey> {
  const secret = process.env.CERT_ENC_KEY;
  
  if (!secret && process.env.NODE_ENV !== "production") {
    // Fallback apenas para desenvolvimento local/testes se a chave não estiver configurada
    const fallback = "fallback-test-key-32-chars-long-123";
    const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fallback));
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  }

  if (!secret) {
    throw new Error("CERT_ENC_KEY não configurada no ambiente.");
  }

  // A chave deve ser preferencialmente Base64 ou Hex de 32 bytes. 
  // Se for uma string comum, o SHA-256 garante os 256 bits necessários.
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/**
 * Criptografa um texto usando AES-256-GCM.
 * Retorna o ciphertext (que inclui o AuthTag no final) e o IV.
 */
export async function encryptToken(plain: string): Promise<{ ciphertext: string; iv: string; version: string }> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits é o padrão recomendado para GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain)
  );
  
  return {
    ciphertext: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    version: "v1" // Versionamento inicial
  };
}

/**
 * Descriptografa um texto usando AES-256-GCM.
 * O SubtleCrypto valida automaticamente o AuthTag que está no final do ciphertext.
 */
export async function decryptToken(ciphertext: string, iv: string, version?: string): Promise<string> {
  // Se no futuro mudarmos a versão, o parâmetro version permitirá escolher o algoritmo/chave corretos.
  const key = await deriveKey();
  const ivBytes = Buffer.from(iv, "base64");
  const ctBytes = Buffer.from(ciphertext, "base64");
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      key,
      ctBytes
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("[Encryption] Falha na descriptografia ou validação de integridade (AuthTag inválido)");
    throw new Error("Falha na integridade dos dados ou chave incorreta.");
  }
}

