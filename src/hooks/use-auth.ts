import { localAuth, localUser } from "@/lib/local-auth";
import { useEffect, useState } from "react";

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

async function resolveUser(): Promise<AppUser | null> {
  return await localUser();
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
      localAuth.onAuthStateChange(
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
