import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { getDb } from "./db.server";
import { hashPassword } from "./password.server";

const createUserSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido." }).max(255),
  password: z
    .string()
    .min(8, { message: "Senha deve ter ao menos 8 caracteres." })
    .max(200),
  nome: z.string().trim().min(1).max(150),
  cargo_id: z.string().uuid(),
});

type IdRow = RowDataPacket & {
  id: string;
};

type RoleRow = RowDataPacket & {
  id: number;
};

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

export const adminCreateUserMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    const auth = context as unknown as { isSuperuser: boolean; roles: string[] } | undefined;
    if (!auth) throw new Error("Sessão inválida.");
    if (
      !auth.isSuperuser &&
      !auth.roles.includes("desenvolvedor")
    ) {
      throw new Error("Apenas desenvolvedores podem cadastrar usuários.");
    }

    const email = data.email.toLowerCase();
    const passwordHash = await hashPassword(data.password);
    const connection = await getDb().getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<IdRow[]>(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email],
      );

      if (existing.length) {
        throw new Error("Já existe um usuário cadastrado com este e-mail.");
      }

      const [cargo] = await connection.execute<IdRow[]>(
        "SELECT id FROM cargos WHERE id = ? LIMIT 1",
        [data.cargo_id],
      );

      if (!cargo.length) {
        throw new Error("Cargo selecionado não existe.");
      }

      const [role] = await connection.execute<RoleRow[]>(
        "SELECT id FROM roles WHERE slug = 'vendedor' LIMIT 1",
      );

      if (!role.length) {
        throw new Error("Role padrão 'vendedor' não encontrada.");
      }

      const userId = randomUUID();

      await connection.execute(
        `INSERT INTO users
          (id, email, password_hash, nome, ativo, email_verified_at)
         VALUES (?, ?, ?, ?, 1, UTC_TIMESTAMP())`,
        [userId, email, passwordHash, data.nome],
      );

      await connection.execute(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, role[0].id],
      );

      await connection.execute(
        `INSERT INTO user_cargos (id, user_id, cargo_id)
         VALUES (?, ?, ?)`,
        [randomUUID(), userId, data.cargo_id],
      );

      await connection.commit();

      return {
        id: userId,
        email,
      };
    } catch (error) {
      await connection.rollback();

      if (isDuplicateEntry(error)) {
        throw new Error("Já existe um usuário cadastrado com este e-mail.");
      }

      throw error;
    } finally {
      connection.release();
    }
  });
