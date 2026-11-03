import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requireAppAuth =
  createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const auth = context as any;

      const {
        data: roleRows,
        error: roleError,
      } = await auth.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.userId);

      if (roleError) {
        throw new Error(
          roleError.message,
        );
      }

      const roles = [
        ...new Set(
          (roleRows ?? [])
            .map(
              (row: any) =>
                row.role,
            )
            .filter(Boolean),
        ),
      ] as string[];

      const isSuperuser =
        roles.includes(
          "desenvolvedor",
        );

      return next({
        context: {
          ...auth,
          roles,
          isSuperuser,
        },
      });
    });
