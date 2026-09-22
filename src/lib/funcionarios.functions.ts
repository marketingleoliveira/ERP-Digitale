import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { getDb } from "./db.server";

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

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

type FuncionarioRow = RowDataPacket & {
  id: string;
  cargo_id: string;
  nome: string;
  tipo: string | null;
  cpf: string | null;
  rg: string | null;
  cep: string | null;
  uf: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  observacao: string | null;
  habilitado: number | boolean;
  cargo_nome: string | null;
};

type LinkedRow = RowDataPacket & {
  funcionario_id: string;
};

let tableReady: Promise<void> | null = null;

function ensureFuncionariosTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await getDb().execute(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id CHAR(36) NOT NULL,
          cargo_id CHAR(36) NOT NULL,
          nome VARCHAR(150) NOT NULL,
          tipo VARCHAR(150) NULL,
          cpf VARCHAR(20) NULL,
          rg VARCHAR(30) NULL,
          cep VARCHAR(12) NULL,
          uf CHAR(2) NULL,
          endereco VARCHAR(200) NULL,
          numero VARCHAR(30) NULL,
          complemento VARCHAR(100) NULL,
          bairro VARCHAR(100) NULL,
          cidade VARCHAR(100) NULL,
          telefone VARCHAR(30) NULL,
          celular VARCHAR(30) NULL,
          email VARCHAR(254) NULL,
          observacao TEXT NULL,
          habilitado TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_funcionarios_nome (nome),
          KEY idx_funcionarios_cargo (cargo_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }

  return tableReady;
}

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

function nullable(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export const listFuncionarios = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async () => {
    await ensureFuncionariosTable();

    const [rows] = await getDb().execute<FuncionarioRow[]>(`
      SELECT
        f.id,
        f.cargo_id,
        f.nome,
        f.tipo,
        f.cpf,
        f.rg,
        f.cep,
        f.uf,
        f.endereco,
        f.numero,
        f.complemento,
        f.bairro,
        f.cidade,
        f.telefone,
        f.celular,
        f.email,
        f.observacao,
        f.habilitado,
        c.nome AS cargo_nome
      FROM funcionarios f
      LEFT JOIN cargos c ON c.id = f.cargo_id
      ORDER BY f.nome ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      cargo_id: row.cargo_id,
      nome: row.nome,
      tipo: row.tipo,
      cpf: row.cpf,
      rg: row.rg,
      cep: row.cep,
      uf: row.uf,
      endereco: row.endereco,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      telefone: row.telefone,
      celular: row.celular,
      email: row.email,
      observacao: row.observacao,
      habilitado: Boolean(row.habilitado),
      cargo: row.cargo_nome
        ? { id: row.cargo_id, nome: row.cargo_nome }
        : null,
    }));
  });

export const saveFuncionario = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((value: unknown) => funcionarioSchema.parse(value))
  .handler(async ({ data }) => {
    await ensureFuncionariosTable();

    const cargo = await getCargo(data.cargo_id);
    const id = data.id ?? randomUUID();

    const values = [
      data.cargo_id,
      data.nome,
      cargo.nome,
      nullable(data.cpf),
      nullable(data.rg),
      nullable(data.cep),
      nullable(data.uf)?.toUpperCase() ?? null,
      nullable(data.endereco),
      nullable(data.numero),
      nullable(data.complemento),
      nullable(data.bairro),
      nullable(data.cidade),
      nullable(data.telefone),
      nullable(data.celular),
      nullable(data.email)?.toLowerCase() ?? null,
      nullable(data.observacao),
      data.habilitado ? 1 : 0,
    ];

    if (data.id) {
      const [result] = await getDb().execute<ResultSetHeader>(
        `UPDATE funcionarios
         SET cargo_id = ?,
             nome = ?,
             tipo = ?,
             cpf = ?,
             rg = ?,
             cep = ?,
             uf = ?,
             endereco = ?,
             numero = ?,
             complemento = ?,
             bairro = ?,
             cidade = ?,
             telefone = ?,
             celular = ?,
             email = ?,
             observacao = ?,
             habilitado = ?
         WHERE id = ?`,
        [...values, id],
      );

      if (!result.affectedRows) {
        throw new Error("Funcionário não encontrado.");
      }
    } else {
      await getDb().execute(
        `INSERT INTO funcionarios (
           id, cargo_id, nome, tipo, cpf, rg, cep, uf, endereco,
           numero, complemento, bairro, cidade, telefone, celular,
           email, observacao, habilitado
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...values],
      );
    }

    return { id };
  });

export const deleteFuncionarios = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((value: unknown) => deleteSchema.parse(value))
  .handler(async ({ data }) => {
    await ensureFuncionariosTable();

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
      throw new Error(
        "Não é possível excluir funcionário vinculado a um usuário.",
      );
    }

    const [result] = await getDb().execute<ResultSetHeader>(
      `DELETE FROM funcionarios WHERE id IN (${placeholders})`,
      ids,
    );

    return { deleted: result.affectedRows };
  });
