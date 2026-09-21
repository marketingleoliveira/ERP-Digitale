import { createMiddleware } from "@tanstack/react-start";
import { getCurrentUserFromRequest } from "./auth.server";

export const requireAppAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const user = await getCurrentUserFromRequest();

    if (!user) {
      throw new Error("Unauthorized: sessão inválida ou expirada");
    }

    return next({
      context: {
        appUser: user,
        userId: user.id,
        roles: user.roles,
        isSuperuser: user.isSuperuser,
      },
    });
  },
);
