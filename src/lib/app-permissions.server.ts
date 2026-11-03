export type AppAuthContext = {
  userId: string;

  supabase: {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{
      data: unknown;
      error: {
        message: string;
      } | null;
    }>;
  };
};

function getAuthContext(
  context: unknown,
): AppAuthContext {
  const auth =
    context as AppAuthContext;

  if (
    !auth?.userId ||
    !auth?.supabase
  ) {
    throw new Error(
      "Sessão inválida.",
    );
  }

  return auth;
}

export async function requireDeveloper(
  context: unknown,
) {
  const auth =
    getAuthContext(context);

  const {
    data,
    error,
  } = await auth.supabase.rpc(
    "has_role",
    {
      _user_id:
        auth.userId,

      _role:
        "desenvolvedor",
    },
  );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  if (!data) {
    throw new Error(
      "Apenas o Desenvolvedor pode executar esta operação.",
    );
  }

  return auth;
}

export async function requireAppPermission(
  context: unknown,
  permission: string,
) {
  const auth =
    getAuthContext(context);

  const {
    data,
    error,
  } = await auth.supabase.rpc(
    "user_has_menu_permission",
    {
      _user_id:
        auth.userId,

      _url:
        permission,
    },
  );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  if (!data) {
    throw new Error(
      "Usuário sem permissão para acessar este recurso.",
    );
  }

  return auth;
}
