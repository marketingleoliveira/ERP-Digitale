import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const optionalText = (max: number) =>
  z.string()
    .trim()
    .max(max)
    .nullable()
    .optional();

const funcionarioSchema = z.object({
  id: z.string().uuid().optional(),
  cargo_id: z.string().uuid(),
  nome: z.string().trim().min(1).max(150),

  cpf: optionalText(20),
  rg: optionalText(30),
  cep: optionalText(12),
  uf: optionalText(2),

  endereco: optionalText(200),
  numero: optionalText(30),
  complemento: optionalText(100),
  bairro: optionalText(100),
  cidade: optionalText(100),

  telefone: optionalText(30),
  celular: optionalText(30),

  email: z.string()
    .trim()
    .email("E-mail inválido.")
    .nullable()
    .optional(),

  observacao: optionalText(2000),

  habilitado: z.boolean(),
});

const deleteSchema = z.object({
  ids: z.array(
    z.string().uuid(),
  ).min(1).max(100),
});

async function getCargo(
  db: any,
  cargoId: string,
) {
  const { data, error } = await db
    .from("cargos")
    .select("id,nome")
    .eq("id", cargoId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "O cargo atribuído ao funcionário não existe.",
    );
  }

  return data;
}

export const listFuncionarios =
  createServerFn({ method: "GET" })
    .middleware([requireSupabaseAuth])
    .handler(async () => {
      const {
        supabaseAdmin,
      } = await import(
        "@/integrations/supabase/client.server"
      );

      const db = supabaseAdmin as any;

      const [
        funcionariosResult,
        cargosResult,
      ] = await Promise.all([
        db
          .from("funcionarios")
          .select("*")
          .order("nome"),

        db
          .from("cargos")
          .select("id,nome"),
      ]);

      if (funcionariosResult.error) {
        throw new Error(
          funcionariosResult.error.message,
        );
      }

      if (cargosResult.error) {
        throw new Error(
          cargosResult.error.message,
        );
      }

      const cargos = new Map(
        (cargosResult.data ?? []).map(
          (cargo: any) => [
            cargo.id,
            cargo,
          ],
        ),
      );

      return (
        funcionariosResult.data ?? []
      ).map((funcionario: any) => ({
        ...funcionario,

        cargo:
          funcionario.cargo_id
            ? cargos.get(
                funcionario.cargo_id,
              ) ?? null
            : null,
      }));
    });

export const saveFuncionario =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((value: unknown) =>
      funcionarioSchema.parse(value),
    )
    .handler(async ({ data }) => {
      const {
        supabaseAdmin,
      } = await import(
        "@/integrations/supabase/client.server"
      );

      const db = supabaseAdmin as any;

      const cargo = await getCargo(
        db,
        data.cargo_id,
      );

      const {
        id,
        ...fields
      } = data;

      const payload = {
        ...fields,
        tipo: cargo.nome,
      };

      if (id) {
        const {
          data: updated,
          error,
        } = await db
          .from("funcionarios")
          .update(payload)
          .eq("id", id)
          .select("id")
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        if (!updated) {
          throw new Error(
            "Funcionário não encontrado.",
          );
        }

        return {
          id,
        };
      }

      const {
        data: created,
        error,
      } = await db
        .from("funcionarios")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return created;
    });

export const deleteFuncionarios =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((value: unknown) =>
      deleteSchema.parse(value),
    )
    .handler(async ({ data }) => {
      const ids = [
        ...new Set(data.ids),
      ];

      const {
        supabaseAdmin,
      } = await import(
        "@/integrations/supabase/client.server"
      );

      const db = supabaseAdmin as any;

      const {
        data: linked,
        error: linkedError,
      } = await db
        .from("profiles")
        .select("funcionario_id")
        .in("funcionario_id", ids)
        .limit(1);

      if (linkedError) {
        throw new Error(
          linkedError.message,
        );
      }

      if ((linked ?? []).length) {
        throw new Error(
          "Não é possível excluir funcionário vinculado a um usuário.",
        );
      }

      const {
        data: deleted,
        error,
      } = await db
        .from("funcionarios")
        .delete()
        .in("id", ids)
        .select("id");

      if (error) {
        throw new Error(error.message);
      }

      return {
        deleted: (
          deleted ?? []
        ).length,
      };
    });
