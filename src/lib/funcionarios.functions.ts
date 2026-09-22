import { createServerFn } from "@tanstack/react-start";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { getDb } from "./db.server";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const funcionarioSchema = z.object({
  id: z.string().uuid().optional(),
  cargo_id: z.string().uuid(),
  nome: z.string().trim().min(1, "Informe o nome.").max(150),
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
  email: z.string().trim().email("E-mail inválido.").nullable().optional(),
  observacao: optionalText(2000),
  habilitado: z.boolean(),
});

const deleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

type CargoRow = RowDataPacket & {
  id: string;
  nome: string;
};

type LinkedRow = RowDataPacket & {
  funcionario_id: string;
};

async function getCargo(cargoId: string): Promise<CargoRow> {
  const [rows] = await getDb().execute<CargoRow[]>(
    "SELECT id, nome FROM cargos WHERE id = ? LIMIT 1",
    [cargoId],
  );

  if (!rows.length) {
    throw new Error("O cargo atribuído ao funcionário não existe.");
  }

  return rows[0];
}

export const listFuncionarios = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("funcionarios")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Não foi possível listar funcionários: ${error.message}`);
    }

    const [cargos] = await getDb().execute<CargoRow[]>("SELECT id, nome FROM cargos");

    const cargosById = new Map(
      cargos.map((cargo) => [cargo.id, { id: cargo.id, nome: cargo.nome }]),
    );

    return (data ?? []).map((funcionario) => ({
      ...funcionario,
      cargo: funcionario.cargo_id ? (cargosById.get(funcionario.cargo_id) ?? null) : null,
    }));
  });

export const saveFuncionario = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((value: unknown) => funcionarioSchema.parse(value))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cargo = await getCargo(data.cargo_id);
    const { id, ...fields } = data;

    const payload = {
      ...fields,
      tipo: cargo.nome,
    };

    if (id) {
      const { error } = await supabaseAdmin.from("funcionarios").update(payload).eq("id", id);

      if (error) {
        throw new Error(`Não foi possível atualizar o funcionário: ${error.message}`);
      }

      return { id };
    }

    const { data: created, error } = await supabaseAdmin
      .from("funcionarios")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(`Não foi possível cadastrar o funcionário: ${error.message}`);
    }

    return created;
  });

export const deleteFuncionarios = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((value: unknown) => deleteSchema.parse(value))
  .handler(async ({ data }) => {
    const ids = [...new Set(data.ids)];
    const placeholders = ids.map(() => "?").join(",");

    const [linked] = await getDb().execute<LinkedRow[]>(
      `SELECT funcionario_id
       FROM users
       WHERE funcionario_id IN (${placeholders})
       LIMIT 1`,
      ids,
    );

    if (linked.length) {
      throw new Error("Não é possível excluir funcionário vinculado a um usuário.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("funcionarios").delete().in("id", ids);

    if (error) {
      throw new Error(`Não foi possível excluir funcionários: ${error.message}`);
    }

    return { deleted: ids.length };
  });
