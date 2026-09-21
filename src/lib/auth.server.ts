import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import type { RowDataPacket } from "mysql2";
import { getDb } from "./db.server";

const SESSION_COOKIE = "erp_digitale_session";
const DEFAULT_SESSION_TTL_HOURS = 12;

export type AppAuthUser = {
  id: string;
  email: string;
  nome: string;
  roles: string[];
  isSuperuser: boolean;
};

type LoginRow = RowDataPacket & {
  id: string;
  email: string;
  password_hash: string;
  nome: string;
  ativo: number;
  roles: string | null;
  is_superuser: number;
};

type SessionRow = RowDataPacket & {
  id: string;
  email: string;
  nome: string;
  roles: string | null;
  is_superuser: number;
};

function parseRoles(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function toAuthUser(row: LoginRow | SessionRow): AppAuthUser {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    roles: parseRoles(row.roles),
    isSuperuser: Boolean(row.is_superuser),
  };
}

function getSessionTtlHours(): number {
  const value = Number(process.env.SESSION_TTL_HOURS || DEFAULT_SESSION_TTL_HOURS);
  return Number.isFinite(value) && value >= 1 && value <= 168
    ? Math.floor(value)
    : DEFAULT_SESSION_TTL_HOURS;
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const parts = encodedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nValue, rValue, pValue, saltHex, hashHex] = parts;
  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);

  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    N < 2 ||
    r < 1 ||
    p < 1
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (!salt.length || !expected.length) return false;

  const actual = await deriveScrypt(password, salt, expected.length, N, r, p);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function consumeDummyPasswordCheck(password: string): Promise<void> {
  const expected = Buffer.alloc(64);
  const actual = await deriveScrypt(
    password,
    Buffer.alloc(16),
    expected.length,
    16384,
    8,
    1,
  );
  if (actual.length === expected.length) timingSafeEqual(actual, expected);
}

export async function authenticateWithPassword(
  email: string,
  password: string,
): Promise<AppAuthUser | null> {
  const db = getDb();
  const [rows] = await db.execute<LoginRow[]>(
    `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        u.nome,
        u.ativo,
        GROUP_CONCAT(r.slug ORDER BY r.id SEPARATOR ',') AS roles,
        COALESCE(MAX(r.is_superuser), 0) AS is_superuser
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = ?
      GROUP BY u.id, u.email, u.password_hash, u.nome, u.ativo
      LIMIT 1
    `,
    [email.trim().toLowerCase()],
  );

  const row = rows[0];
  if (!row || !row.ativo) {
    await consumeDummyPasswordCheck(password);
    return null;
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return null;

  return toAuthUser(row);
}

function readSessionToken(): string | null {
  const cookieHeader = getRequestHeader("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(/;\s*/)) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator) === SESSION_COOKIE) {
      return part.slice(separator + 1) || null;
    }
  }

  return null;
}

function setSessionCookie(token: string, maxAgeSeconds: number): void {
  const attributes = [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  setResponseHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(): void {
  const attributes = [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  setResponseHeader("Set-Cookie", attributes.join("; "));
}

function getRequestMetadata(): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = getRequestHeader("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim().slice(0, 45) || null;
  const userAgent = getRequestHeader("user-agent")?.slice(0, 500) || null;
  return { ipAddress, userAgent };
}

export async function createLoginSession(user: AppAuthUser): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const ttlHours = getSessionTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const { ipAddress, userAgent } = getRequestMetadata();

  await db.execute("DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()");

  await db.execute(
    `
      INSERT INTO sessions
        (id, user_id, token_hash, expires_at, last_seen_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
    `,
    [randomUUID(), user.id, tokenHash, expiresAt, ipAddress, userAgent],
  );

  await db.execute(
    "UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?",
    [user.id],
  );

  setSessionCookie(token, ttlHours * 60 * 60);
}

export async function getCurrentUserFromRequest(): Promise<AppAuthUser | null> {
  const token = readSessionToken();
  if (!token) return null;

  const db = getDb();
  const [rows] = await db.execute<SessionRow[]>(
    `
      SELECT
        u.id,
        u.email,
        u.nome,
        GROUP_CONCAT(r.slug ORDER BY r.id SEPARATOR ',') AS roles,
        COALESCE(MAX(r.is_superuser), 0) AS is_superuser
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE
        s.token_hash = ?
        AND s.expires_at > UTC_TIMESTAMP()
        AND u.ativo = 1
      GROUP BY s.id, u.id, u.email, u.nome
      LIMIT 1
    `,
    [hashSessionToken(token)],
  );

  const row = rows[0];
  if (!row) return null;

  await db.execute(
    "UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = ?",
    [hashSessionToken(token)],
  );

  return toAuthUser(row);
}

export async function destroyCurrentSession(): Promise<void> {
  const token = readSessionToken();

  if (token) {
    await getDb().execute("DELETE FROM sessions WHERE token_hash = ?", [
      hashSessionToken(token),
    ]);
  }

  clearSessionCookie();
}
