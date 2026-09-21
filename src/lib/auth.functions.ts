import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  authenticateWithPassword,
  createLoginSession,
  destroyCurrentSession,
  getCurrentUserFromRequest,
} from "./auth.server";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(200),
});

export const loginApp = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const user = await authenticateWithPassword(data.email, data.password);

    if (!user) {
      return { ok: false as const, error: "E-mail ou senha inválidos." };
    }

    await createLoginSession(user);
    return { ok: true as const, user };
  });

export const getCurrentAppUser = createServerFn({ method: "GET" }).handler(
  async () => getCurrentUserFromRequest(),
);

export const logoutApp = createServerFn({ method: "POST" }).handler(async () => {
  await destroyCurrentSession();
  return { ok: true as const };
});
