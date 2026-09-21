import { useEffect, useState } from "react";
import { getCurrentAppUser } from "@/lib/auth.functions";

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
let inflight: Promise<AppUser | null> | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

async function loadCurrentUser(force = false): Promise<AppUser | null> {
  if (!force && loaded) return snapshot.user;
  if (inflight) return inflight;

  snapshot = {
    ...snapshot,
    loading: true,
  };
  emit();

  inflight = getCurrentAppUser()
    .then((user) => {
      loaded = true;
      snapshot = {
        user: user as AppUser | null,
        loading: false,
      };
      emit();
      return snapshot.user;
    })
    .catch(() => {
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

export async function refreshAuth(): Promise<AppUser | null> {
  loaded = false;
  return loadCurrentUser(true);
}

export function clearAuthCache(): void {
  loaded = true;
  snapshot = {
    user: null,
    loading: false,
  };
  emit();
}

export function useAuth() {
  const [state, setState] = useState<AuthSnapshot>(snapshot);

  useEffect(() => {
    const listener = () => setState({ ...snapshot });
    listeners.add(listener);

    if (!loaded) void loadCurrentUser();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session: state.user ? { user: state.user } : null,
    user: state.user,
    loading: state.loading,
    refresh: refreshAuth,
  };
}

export function useUserRoles(userId?: string): AppRole[] {
  const { user } = useAuth();

  if (!userId || !user || user.id !== userId) {
    return [];
  }

  return user.roles as AppRole[];
}
