import { createMiddleware } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/auth-middleware";

const ALLOWED_E2E_ENVS = new Set(["staging", "test", "e2e"]);

export const requireE2eAuth = createMiddleware({ type: "function" })
  .middleware([requireAppAuth])
  .server(async ({ next, context }) => {
    const env = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "").toLowerCase();

    if (!ALLOWED_E2E_ENVS.has(env)) {
      throw new Error("Harness E2E bloqueado: APP_ENV deve ser staging, test ou e2e");
    }

    const auth = context as {
      userId: string;
      roles: string[];
      isSuperuser: boolean;
    };

    const autorizado =
      auth.isSuperuser || auth.roles.includes("desenvolvedor") || auth.roles.includes("gerente");

    if (!autorizado) {
      throw new Error("Acesso restrito: cargo desenvolvedor ou gerente");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    return next({
      context: {
        ...context,
        supabase: supabaseAdmin,
      },
    });
  });
