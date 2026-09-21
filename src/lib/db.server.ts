import { createPool, type Pool } from "mysql2/promise";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

function createDatabasePool(): Pool {
  return createPool({
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || "3306"),
    database: requiredEnv("DB_NAME"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z",
  });
}

declare global {
  var __erpDigitaleDbPool: Pool | undefined;
}

export function getDb(): Pool {
  if (!globalThis.__erpDigitaleDbPool) {
    globalThis.__erpDigitaleDbPool = createDatabasePool();
  }

  return globalThis.__erpDigitaleDbPool;
}
