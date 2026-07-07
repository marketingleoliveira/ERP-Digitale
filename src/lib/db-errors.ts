// Traduz erros comuns do Postgres/Supabase para mensagens em PT-BR.
const FIELD_LABEL: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  codigo: "código",
  email: "e-mail",
  nome: "nome",
  slug: "identificador",
};

export function friendlyDbError(err: unknown): string {
  const e = err as { code?: string; message?: string; details?: string } | null;
  if (!e) return "Erro desconhecido.";
  const msg = e.message ?? "";
  const details = e.details ?? "";

  // 23505 = unique_violation
  if (e.code === "23505" || /duplicate key value/i.test(msg)) {
    // tenta extrair coluna
    const m = /Key \(([^)]+)\)=\(([^)]+)\)/.exec(details || msg);
    const col = m?.[1]?.split(",")[0]?.trim().toLowerCase();
    const val = m?.[2];
    const label = col ? (FIELD_LABEL[col] ?? col) : "registro";
    return val
      ? `Já existe um cadastro com este ${label}: "${val}".`
      : `Já existe um cadastro com este ${label}.`;
  }
  if (e.code === "23503") return "Registro relacionado não encontrado.";
  if (e.code === "23502") return "Campo obrigatório não preenchido.";
  if (/User already registered|already been registered|email.*exists/i.test(msg))
    return "Já existe um usuário cadastrado com este e-mail.";
  return msg || "Erro ao salvar.";
}
