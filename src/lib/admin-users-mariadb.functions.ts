import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { requireAppPermission } from "./app-permissions.server";
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

type UserDeleteTargetRow = RowDataPacket & {
  id: string;
  is_superuser: number;
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
    await requireAppPermission(context, "/dev/cargos");

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

type UserListRow = RowDataPacket & {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  ativo: number;
};

type UserRoleListRow = RowDataPacket & {
  user_id: string;
  role: string;
  is_superuser: number;
};

type UserCargoListRow = RowDataPacket & {
  user_id: string;
  cargo_id: string;
  cargo_nome: string;
};

const updateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().trim().email({ message: "E-mail inválido." }).max(255),
  nome: z.string().trim().min(1).max(150),
  telefone: z.string().trim().max(30).nullable().optional(),
  ativo: z.boolean(),
  cargo_ids: z.array(z.string().uuid()).max(50),
});

const deleteUsersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

type UserAdminContext = {
  userId: string;
  isSuperuser: boolean;
  roles: string[];
};

function requireUserAdmin(context: unknown): UserAdminContext {
  const auth = context as UserAdminContext | undefined;

  if (!auth?.userId) {
    throw new Error("Sessão inválida.");
  }

  if (!auth.isSuperuser && !auth.roles.includes("desenvolvedor")) {
    throw new Error("Apenas desenvolvedores podem gerenciar usuários.");
  }

  return auth;
}

function normalizeCargoIds(values: string[]): string[] {
  return [...new Set(values)];
}

export const adminListUsersMariaDb = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    await requireAppPermission(context, "/dev/cargos");

    const db = getDb();

    const [users] = await db.execute<UserListRow[]>(
      `SELECT id, email, nome, telefone, ativo
       FROM users
       ORDER BY nome, email`,
    );

    const [roles] = await db.execute<UserRoleListRow[]>(
      `SELECT ur.user_id, r.slug AS role, r.is_superuser
       FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
       ORDER BY r.slug`,
    );

    const [cargos] = await db.execute<UserCargoListRow[]>(
      `SELECT uc.user_id, c.id AS cargo_id, c.nome AS cargo_nome
       FROM user_cargos uc
       INNER JOIN cargos c ON c.id = uc.cargo_id
       ORDER BY c.nome`,
    );

    const rolesByUser = new Map<string, string[]>();
    const superusers = new Set<string>();
    const cargosByUser = new Map<
      string,
      Array<{ id: string; nome: string }>
    >();

    for (const row of roles) {
      const current = rolesByUser.get(row.user_id) ?? [];
      current.push(row.role);
      rolesByUser.set(row.user_id, current);

      if (row.is_superuser) {
        superusers.add(row.user_id);
      }
    }

    for (const row of cargos) {
      const current = cargosByUser.get(row.user_id) ?? [];
      current.push({
        id: row.cargo_id,
        nome: row.cargo_nome,
      });
      cargosByUser.set(row.user_id, current);
    }

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
      ativo: Boolean(user.ativo),
      roles: rolesByUser.get(user.id) ?? [],
      cargos: cargosByUser.get(user.id) ?? [],
      isSuperuser: superusers.has(user.id),
    }));
  });

export const adminUpdateUserMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((data: unknown) => updateUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAppPermission(context, "/dev/cargos");

    const email = data.email.toLowerCase();
    const cargoIds = normalizeCargoIds(data.cargo_ids);
    const connection = await getDb().getConnection();

    try {
      await connection.beginTransaction();

      const [target] = await connection.execute<IdRow[]>(
        "SELECT id FROM users WHERE id = ? FOR UPDATE",
        [data.id],
      );

      if (!target.length) {
        throw new Error("Usuário não encontrado.");
      }

      const [superuser] = await connection.execute<IdRow[]>(
        `SELECT ur.user_id AS id
         FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ?
           AND r.is_superuser = 1
         LIMIT 1`,
        [data.id],
      );

      if (superuser.length) {
        throw new Error(
          "Usuário master/superusuário não pode ser alterado por esta operação.",
        );
      }

      if (cargoIds.length) {
        const placeholders = cargoIds.map(() => "?").join(",");

        const [existingCargos] = await connection.execute<IdRow[]>(
          `SELECT id
           FROM cargos
           WHERE id IN (${placeholders})`,
          cargoIds,
        );

        if (existingCargos.length !== cargoIds.length) {
          throw new Error("Um ou mais cargos selecionados não existem.");
        }
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE users
         SET email = ?,
             nome = ?,
             telefone = ?,
             ativo = ?
         WHERE id = ?`,
        [
          email,
          data.nome,
          data.telefone?.trim() || null,
          data.ativo ? 1 : 0,
          data.id,
        ],
      );

      if (result.affectedRows !== 1) {
        throw new Error("Usuário não encontrado.");
      }

      await connection.execute(
        "DELETE FROM user_cargos WHERE user_id = ?",
        [data.id],
      );

      for (const cargoId of cargoIds) {
        await connection.execute(
          `INSERT INTO user_cargos (id, user_id, cargo_id)
           VALUES (?, ?, ?)`,
          [randomUUID(), data.id, cargoId],
        );
      }

      await connection.commit();

      return { ok: true as const };
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

export const adminDeleteUsersMariaDb = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((data: unknown) => deleteUsersSchema.parse(data))
  .handler(async ({ data, context }) => {
    const auth = await requireAppPermission(context, "/dev/cargos");
    const ids = normalizeCargoIds(data.ids);

    if (ids.includes(auth.userId)) {
      throw new Error("Você não pode excluir o usuário da sessão atual.");
    }

    const placeholders = ids.map(() => "?").join(",");
    const connection = await getDb().getConnection();

    try {
      await connection.beginTransaction();

      const [targets] = await connection.execute<UserDeleteTargetRow[]>(
        `SELECT u.id,
                EXISTS (
                  SELECT 1
                  FROM user_roles ur
                  INNER JOIN roles r ON r.id = ur.role_id
                  WHERE ur.user_id = u.id
                    AND r.is_superuser = 1
                ) AS is_superuser
         FROM users u
         WHERE u.id IN (${placeholders})
         FOR UPDATE`,
        ids,
      );

      if (targets.length !== ids.length) {
        throw new Error("Um ou mais usuários selecionados não existem.");
      }

      if (targets.some((target) => Boolean(target.is_superuser))) {
        throw new Error("Usuário master/superusuário não pode ser excluído.");
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM users WHERE id IN (${placeholders})`,
        ids,
      );

      if (result.affectedRows !== ids.length) {
        throw new Error("Não foi possível excluir todos os usuários selecionados.");
      }

      await connection.commit();

      return { deleted: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
