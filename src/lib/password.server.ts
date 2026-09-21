import { randomBytes, scrypt } from "node:crypto";

function deriveScrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  N: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N, r, p, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8 || password.length > 200) {
    throw new Error("A senha deve ter entre 8 e 200 caracteres.");
  }

  const salt = randomBytes(16);
  const hash = await deriveScrypt(password, salt, 64, 16384, 8, 1);

  return `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}
