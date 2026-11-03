import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "desenvolvedor"
  | "admin"
  | "gerente"
  | "vendedor"
  | "producao"
  | "financeiro"
  | "logistica"
  | "qualidade";

export type AppUser = {
  id: string;
  email: string;
  nome: string;
  roles: string[];
  isSuperuser: boolean;
  permissions: string[];
};

type AuthSnapshot = {
  user: AppUser | null;
  loading: boolean;
};

let snapshot: AuthSnapshot = {
  user: null,
  loading: true,
};

let loaded = false;
let inflight: Promise<AppUser | null> | null =
  null;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

async function resolveUser():
  Promise<AppUser | null> {

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    return null;
  }

  const authUser = session.user;

  const db = supabase as any;

  const [
    profileResult,
    rolesResult,
    cargosResult,
  ] = await Promise.all([
    db
      .from("profiles")
      .select(
        "id,nome,email,ativo",
      )
      .eq("id", authUser.id)
      .maybeSingle(),

    db
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id),

    db
      .from("user_cargos")
      .select("cargo_id")
      .eq("user_id", authUser.id),
  ]);

  if (profileResult.error) {
    throw new Error(
      profileResult.error.message,
    );
  }

  if (rolesResult.error) {
    throw new Error(
      rolesResult.error.message,
    );
  }

  if (cargosResult.error) {
    throw new Error(
      cargosResult.error.message,
    );
  }

  if (profileResult.data?.ativo === false) {
    await supabase.auth.signOut();
    return null;
  }

  const roles = [
    ...new Set(
      (rolesResult.data ?? [])
        .map(
          (row: { role?: string }) =>
            row.role,
        )
        .filter(Boolean),
    ),
  ] as string[];

  const isSuperuser =
    roles.includes("desenvolvedor");

  const cargoIds = [
    ...new Set(
      (cargosResult.data ?? [])
        .map(
          (row: { cargo_id?: string }) =>
            row.cargo_id,
        )
        .filter(Boolean),
    ),
  ] as string[];

  let permissions: string[] = [];

  if (
    !isSuperuser &&
    cargoIds.length > 0
  ) {
    const result = await db
      .from("cargos")
      .select("permissoes")
      .in("id", cargoIds);

    if (result.error) {
      throw new Error(
        result.error.message,
      );
    }

    permissions = [
      ...new Set(
        (result.data ?? []).flatMap(
          (
            row: {
              permissoes?: string[] | null;
            },
          ) =>
            Array.isArray(row.permissoes)
              ? row.permissoes
              : [],
        ),
      ),
    ];
  }

  return {
    id: authUser.id,

    email:
      profileResult.data?.email ??
      authUser.email ??
      "",

    nome:
      profileResult.data?.nome ??
      authUser.user_metadata?.nome ??
      authUser.email?.split("@")[0] ??
      "Usuário",

    roles,
    isSuperuser,
    permissions,
  };
}

async function loadCurrentUser(
  force = false,
): Promise<AppUser | null> {

  if (!force && loaded) {
    return snapshot.user;
  }

  if (inflight) {
    return inflight;
  }

  snapshot = {
    ...snapshot,
    loading: true,
  };

  emit();

  inflight = resolveUser()
    .then((user) => {
      loaded = true;

      snapshot = {
        user,
        loading: false,
      };

      emit();

      return user;
    })
    .catch((error) => {
      console.error("[AUTH]", error);

      loaded = true;

      snapshot = {
        user: null,
        loading: false,
      };

      emit();

      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function refreshAuth() {
  loaded = false;

  return loadCurrentUser(true);
}

export function clearAuthCache() {
  loaded = true;

  snapshot = {
    user: null,
    loading: false,
  };

  emit();
}

export function useAuth() {
  const [state, setState] =
    useState<AuthSnapshot>(snapshot);

  useEffect(() => {
    const listener = () =>
      setState({ ...snapshot });

    listeners.add(listener);

    if (!loaded) {
      void loadCurrentUser();
    }

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event) => {
          if (
            event === "SIGNED_OUT"
          ) {
            clearAuthCache();
            return;
          }

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {
            void refreshAuth();
          }
        },
      );

    return () => {
      listeners.delete(listener);
      subscription.unsubscribe();
    };
  }, []);

  return {
    session: state.user
      ? { user: state.user }
      : null,

    user: state.user,
    loading: state.loading,
    refresh: refreshAuth,
  };
}

export function useUserRoles(
  userId?: string,
): AppRole[] {

  const { user } = useAuth();

  if (
    !userId ||
    !user ||
    user.id !== userId
  ) {
    return [];
  }

  return user.roles as AppRole[];
}

export function useHasAppPermission(
  permission: string,
) {
  const { user } = useAuth();

  return Boolean(
    user &&
      (
        user.isSuperuser ||
        user.roles.includes(
          "desenvolvedor",
        ) ||
        user.permissions.includes(
          permission,
        )
      ),
  );
}
