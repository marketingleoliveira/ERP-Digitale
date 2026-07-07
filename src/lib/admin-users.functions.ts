import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createUserSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido." }).max(255),
  password: z.string().min(6, { message: "Senha deve ter ao menos 6 caracteres." }).max(72),
  nome: z.string().trim().min(1).max(150),
  cargo_id: z.string().uuid().optional().nullable(),
});

/**
 * Cria um novo usuário via Auth Admin API sem alterar a sessão do chamador.
 * Requer que o chamador esteja autenticado E tenha cargo 'desenvolvedor'.
 */
export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Autorização: apenas desenvolvedor
    const { data: isDev, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "desenvolvedor",
    });
    if (roleErr) throw new Error("Falha ao verificar permissões.");
    if (!isDev) throw new Error("Apenas desenvolvedores podem cadastrar usuários.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Checagem prévia amigável de e-mail duplicado
    const emailLower = data.email.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", emailLower)
      .maybeSingle();
    if (existing) throw new Error("Já existe um usuário cadastrado com este e-mail.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error) {
      if (/registered|exists|duplicate/i.test(error.message))
        throw new Error("Já existe um usuário cadastrado com este e-mail.");
      throw new Error(error.message);
    }

    const uid = created.user?.id;
    if (!uid) throw new Error("Falha ao criar usuário.");

    if (data.cargo_id) {
      const { error: e2 } = await supabaseAdmin
        .from("user_cargos")
        .insert({ user_id: uid, cargo_id: data.cargo_id });
      if (e2 && !/duplicate/i.test(e2.message)) throw new Error(e2.message);
    }

    return { id: uid, email: data.email };
  });
