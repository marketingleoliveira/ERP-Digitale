import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { requireAppPermission, requireDeveloper } from "./app-permissions.server";
import { getDb } from "./db.server";

const COMPOSICAO_PERMISSION = "/composicao";

type ComposicaoRow = RowDataPacket & {
  id: string;
  tipo: "Artigo" | "Fio";
  codigo: string;
  ncm: string | null;
  composicao: string;
  habilitado: number;
};

const composicaoSchema = z.object({
  tipo: z.enum(["Artigo", "Fio"]),
  codigo: z.string().trim().min(1).max(100),
  ncm: z.string().trim().max(20).nullable().optional(),
  composicao: z.string().trim().min(1).max(2000),
  habilitado: z.boolean(),
});

const updateComposicaoSchema = composicaoSchema.extend({
  id: z.string().uuid(),
});

const idSchema = z.object({
  id: z.string().uuid(),
});

const toggleSchema = idSchema.extend({
  habilitado: z.boolean(),
});

function nullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

function isReferencedEntry(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["ER_ROW_IS_REFERENCED", "ER_ROW_IS_REFERENCED_2"].includes(
      (error as { code?: string }).code ?? "",
    )
  );
}

export const listComposicoesMariaDb = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    await requireAppPermission(context, COMPOSICAO_PERMISSION);

    const [rows] = await getDb().execute<ComposicaoRow[]>(
      `SELECT id, tipo, codigo, ncm, composicao, habilitado
       FROM composicoes
       ORDER BY tipo, codigo`,
    );

    return rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      codigo: row.codigo,
      ncm: row.ncm,
      composicao: row.composicao,
      habilitado: Boolean(row.habilitado),
    }));
  });

export const createComposicaoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator((data: unknown) => composicaoSchema.parse(data))
  .handler(async ({ data, context }) => {
    const auth = await requireAppPermission(context, COMPOSICAO_PERMISSION);
    const id = randomUUID();

    try {
      await getDb().execute<ResultSetHeader>(
        `INSERT INTO composicoes
          (id, tipo, codigo, ncm, composicao, habilitado, owner_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.tipo,
          data.codigo,
          nullableText(data.ncm),
          data.composicao,
          data.habilitado ? 1 : 0,
          auth.userId,
        ],
      );
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new Error("Já existe uma composição com este código.");
      }
      throw error;
    }

    return { id };
  });

export const updateComposicaoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator((data: unknown) => updateComposicaoSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, COMPOSICAO_PERMISSION);

    try {
      const [result] = await getDb().execute<ResultSetHeader>(
        `UPDATE composicoes
         SET tipo = ?,
             codigo = ?,
             ncm = ?,
             composicao = ?,
             habilitado = ?
         WHERE id = ?`,
        [
          data.tipo,
          data.codigo,
          nullableText(data.ncm),
          data.composicao,
          data.habilitado ? 1 : 0,
          data.id,
        ],
      );

      if (result.affectedRows !== 1) {
        throw new Error("Composição não encontrada.");
      }
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new Error("Já existe uma composição com este código.");
      }
      throw error;
    }

    return { ok: true as const };
  });

export const toggleComposicaoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator((data: unknown) => toggleSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, COMPOSICAO_PERMISSION);

    const [result] = await getDb().execute<ResultSetHeader>(
      `UPDATE composicoes
       SET habilitado = ?
       WHERE id = ?`,
      [data.habilitado ? 1 : 0, data.id],
    );

    if (result.affectedRows !== 1) {
      throw new Error("Composição não encontrada.");
    }

    return { ok: true as const };
  });

export const deleteComposicaoMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, COMPOSICAO_PERMISSION);
    requireDeveloper(context);

    try {
      const [result] = await getDb().execute<ResultSetHeader>(
        "DELETE FROM composicoes WHERE id = ?",
        [data.id],
      );

      if (result.affectedRows !== 1) {
        throw new Error("Composição não encontrada.");
      }
    } catch (error) {
      if (isReferencedEntry(error)) {
        throw new Error(
          "Esta composição está sendo utilizada por outro cadastro e não pode ser excluída.",
        );
      }
      throw error;
    }

    return { ok: true as const };
  });
