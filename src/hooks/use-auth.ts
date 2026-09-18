import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type AppRole =
  | "desenvolvedor"
  | "gerente"
  | "vendedor"
  | "producao"
  | "financeiro"
  | "logistica"
  | "qualidade";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return { session, user, loading, profile };
}

export function useUserRoles(userId?: string) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  useEffect(() => {
    if (!userId) {
      setRoles([]);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as AppRole));
      });
  }, [userId]);
  return roles;
}
