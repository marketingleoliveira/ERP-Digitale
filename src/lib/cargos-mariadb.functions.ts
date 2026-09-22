import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { requireAppPermission } from "./app-permissions.server";
import { getDb } from "./db.server";

type AuthContext = {
  isSuperuser: boolean;
  roles: string[];
};

type CargoRow = RowDataPacket & {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: string | string[] | null;
};

const permissionSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((value) => value.startsWith("/"), "Permissão de menu inválida.");

const cargoSchema = z.object({
  nome: z.string().trim().min(1).max(150),
  descricao: z.string().trim().max(2000).nullable().optional(),
  permissoes: z.array(permissionSchema).max(250),
});

const updateCargoSchema = cargoSchema.extend({
  id: z.string().uuid(),
});

const deleteCargoSchema = z.object({
  id: z.string().uuid(),
});

function requireDeveloper(context: unknown): void {
  const auth = context as AuthContext | undefined;

  if (!auth) {
    throw new Error("Sessão inválida.");
  }

  if (!auth.isSuperuser && !auth.roles.includes("desenvolvedor")) {
    throw new Error("Apenas desenvolvedores podem gerenciar cargos.");
  }
}

function normalizePermissions(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parsePermissions(value: string | string[] | null): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

export const adminListCargosMariaDb = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    await requireAppPermission(context, "/dev/cargos");

    const [rows] = await getDb().execute<CargoRow[]>(
      `SELECT id, nome, descricao, permissoes
       FROM cargos
       ORDER BY nome`,
    );

    return rows.map((row) => ({
      ...row,
      permissoes: parsePermissions(row.permissoes),
    }));
  });

export const adminCreateCargoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((data: unknown) => cargoSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, "/dev/cargos");

    const id = randomUUID();
    const permissoes = normalizePermissions(data.permissoes);

    try {
      await getDb().execute<ResultSetHeader>(
        `INSERT INTO cargos (id, nome, descricao, permissoes)
         VALUES (?, ?, ?, ?)`,
        [id, data.nome, data.descricao || null, JSON.stringify(permissoes)],
      );
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new Error("Já existe um cargo com este nome.");
      }
      throw error;
    }

    return { id };
  });

export const adminUpdateCargoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((data: unknown) => updateCargoSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, "/dev/cargos");

    const permissoes = normalizePermissions(data.permissoes);

    try {
      const [result] = await getDb().execute<ResultSetHeader>(
        `UPDATE cargos
         SET nome = ?, descricao = ?, permissoes = ?
         WHERE id = ?`,
        [
          data.nome,
          data.descricao || null,
          JSON.stringify(permissoes),
          data.id,
        ],
      );

      if (result.affectedRows !== 1) {
        throw new Error("Cargo não encontrado.");
      }
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new Error("Já existe um cargo com este nome.");
      }
      throw error;
    }

    return { ok: true as const };
  });

export const adminDeleteCargoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((data: unknown) => deleteCargoSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, "/dev/cargos");

    const [result] = await getDb().execute<ResultSetHeader>(
      "DELETE FROM cargos WHERE id = ?",
      [data.id],
    );

    if (result.affectedRows !== 1) {
      throw new Error("Cargo não encontrado.");
    }

    return { ok: true as const };
  });
