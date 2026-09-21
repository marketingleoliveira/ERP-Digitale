import type { RowDataPacket } from "mysql2";
import { getDb } from "./db.server";

export type AppAuthContext = {
  appUser?: {
    id: string;
  };
  userId: string;
  roles: string[];
  isSuperuser: boolean;
};

type CargoPermissionRow = RowDataPacket & {
  permissoes: string;
};

function getAuthContext(context: unknown): AppAuthContext {
  const auth = context as AppAuthContext | undefined;

  if (!auth?.userId) {
    throw new Error("Sessão inválida.");
  }

  return auth;
}

function parsePermissions(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function requireDeveloper(context: unknown): AppAuthContext {
  const auth = getAuthContext(context);

  if (!auth.isSuperuser && !auth.roles.includes("desenvolvedor")) {
    throw new Error("Apenas o Desenvolvedor pode executar esta operação.");
  }

  return auth;
}

export async function requireAppPermission(
  context: unknown,
  permission: string,
): Promise<AppAuthContext> {
  const auth = getAuthContext(context);

  if (auth.isSuperuser || auth.roles.includes("desenvolvedor")) {
    return auth;
  }

  const [rows] = await getDb().execute<CargoPermissionRow[]>(
    `SELECT c.permissoes
     FROM user_cargos uc
     INNER JOIN cargos c ON c.id = uc.cargo_id
     WHERE uc.user_id = ?`,
    [auth.userId],
  );

  const allowed = rows.some((row) =>
    parsePermissions(row.permissoes).includes(permission),
  );

  if (!allowed) {
    throw new Error("Usuário sem permissão para acessar este recurso.");
  }

  return auth;
}
