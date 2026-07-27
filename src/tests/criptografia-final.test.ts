import { describe, it, expect, beforeAll } from "vitest";
import { encryptToken, decryptToken } from "../services/fiscal/encryption.server";

describe("Segurança Criptográfica - Etapa 11.3", () => {
  const testToken = "test-focus-token-12345";

  it("deve criptografar e descriptografar corretamente", async () => {
    const { ciphertext, iv, version } = await encryptToken(testToken);
    expect(ciphertext).toBeDefined();
    expect(iv).toBeDefined();
    expect(version).toBe("v1");

    const decrypted = await decryptToken(ciphertext, iv, version);
    expect(decrypted).toBe(testToken);
  });

  it("deve gerar IVs diferentes para o mesmo texto", async () => {
    const res1 = await encryptToken(testToken);
    const res2 = await encryptToken(testToken);
    expect(res1.iv).not.toBe(res2.iv);
    expect(res1.ciphertext).not.toBe(res2.ciphertext);
  });

  it("deve falhar se o ciphertext for adulterado (AuthTag mismatch)", async () => {
    const { ciphertext, iv, version } = await encryptToken(testToken);
    
    // Altera um caractere do Base64 do ciphertext
    const corruptedCiphertext = ciphertext.substring(0, ciphertext.length - 5) + "AAAAA";
    
    await expect(decryptToken(corruptedCiphertext, iv, version))
      .rejects.toThrow("Falha na integridade dos dados");
  });

  it("deve falhar se o IV for adulterado", async () => {
    const { ciphertext, iv, version } = await encryptToken(testToken);
    
    // Altera um caractere do Base64 do IV
    const corruptedIv = iv.substring(0, iv.length - 2) + "ZZ";
    
    await expect(decryptToken(ciphertext, corruptedIv, version))
      .rejects.toThrow();
  });
});
