/**
 * Validador de pré-emissão NF-e (Focus NFe).
 * Bloqueia envio à SEFAZ quando faltar qualquer dado obrigatório.
 * Retorna lista de erros por dimensão (empresa / cliente / itens / ambiente).
 */
type Rec = Record<string, unknown>;

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";
const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export type NfeValidationError = { escopo: string; campo: string; mensagem: string };

export function validarEmpresa(empresa: Rec | null): NfeValidationError[] {
  const errs: NfeValidationError[] = [];
  if (!empresa) return [{ escopo: "empresa", campo: "*", mensagem: "Empresa não configurada." }];
  const req: Array<[string, string]> = [
    ["razao_social", "Razão Social"], ["cnpj", "CNPJ"], ["inscricao_estadual", "IE"],
    ["crt", "CRT"], ["logradouro", "Logradouro"], ["numero", "Número"],
    ["bairro", "Bairro"], ["cidade", "Cidade"], ["uf", "UF"], ["cep", "CEP"],
    ["serie_nfe", "Série NF-e"], ["proximo_numero_nfe", "Próximo número NF-e"],
  ];
  for (const [k, l] of req) if (isBlank(empresa[k])) errs.push({ escopo: "empresa", campo: k, mensagem: `${l} obrigatório.` });
  if (digits(empresa.cnpj).length !== 14) errs.push({ escopo: "empresa", campo: "cnpj", mensagem: "CNPJ inválido (14 dígitos)." });
  if (digits(empresa.cep).length !== 8) errs.push({ escopo: "empresa", campo: "cep", mensagem: "CEP inválido (8 dígitos)." });
  if (empresa.provedor_nfe !== "focus_nfe")
    errs.push({ escopo: "empresa", campo: "provedor_nfe", mensagem: "Provedor precisa ser Focus NFe." });
  if (!["homologacao", "producao"].includes(String(empresa.ambiente_nfe ?? "")))
    errs.push({ escopo: "empresa", campo: "ambiente_nfe", mensagem: "Ambiente NF-e inválido." });
  return errs;
}

export function validarCliente(cli: Rec | null): NfeValidationError[] {
  const errs: NfeValidationError[] = [];
  if (!cli) return [{ escopo: "cliente", campo: "*", mensagem: "Destinatário não informado." }];
  const doc = digits(cli.cnpj ?? cli.cpf);
  if (doc.length !== 11 && doc.length !== 14) errs.push({ escopo: "cliente", campo: "documento", mensagem: "CNPJ/CPF inválido." });
  if (isBlank(cli.razao_social) && isBlank(cli.nome_fantasia) && isBlank(cli.nome))
    errs.push({ escopo: "cliente", campo: "razao_social", mensagem: "Razão social/nome obrigatório." });
  for (const [k, l] of [["logradouro", "Logradouro"], ["bairro", "Bairro"], ["cidade", "Cidade"], ["uf", "UF"]] as const)
    if (isBlank(cli[k] ?? cli.endereco)) errs.push({ escopo: "cliente", campo: k, mensagem: `${l} do destinatário obrigatório.` });
  if (digits(cli.cep).length !== 8) errs.push({ escopo: "cliente", campo: "cep", mensagem: "CEP do destinatário inválido." });
  const indIe = Number(cli.indicador_ie ?? 9);
  if (indIe === 1 && isBlank(cli.inscricao_estadual))
    errs.push({ escopo: "cliente", campo: "inscricao_estadual", mensagem: "IE obrigatória para contribuinte." });
  return errs;
}

export function validarItens(itens: Rec[] | null): NfeValidationError[] {
  const errs: NfeValidationError[] = [];
  if (!itens || itens.length === 0) return [{ escopo: "itens", campo: "*", mensagem: "NF-e sem itens." }];
  itens.forEach((it, idx) => {
    const tag = `item ${idx + 1}`;
    const ncm = digits(it.ncm);
    if (ncm.length !== 8) errs.push({ escopo: "itens", campo: `${tag}.ncm`, mensagem: `${tag}: NCM inválido (8 dígitos).` });
    if (isBlank(it.cfop) || digits(it.cfop).length !== 4)
      errs.push({ escopo: "itens", campo: `${tag}.cfop`, mensagem: `${tag}: CFOP obrigatório (4 dígitos).` });
    if (isBlank(it.cst_icms) && isBlank(it.csosn))
      errs.push({ escopo: "itens", campo: `${tag}.cst`, mensagem: `${tag}: CST/CSOSN obrigatório.` });
    if (Number(it.quantidade ?? it.qtd_saida ?? 0) <= 0)
      errs.push({ escopo: "itens", campo: `${tag}.quantidade`, mensagem: `${tag}: quantidade deve ser > 0.` });
    if (Number(it.valor_unitario ?? 0) <= 0)
      errs.push({ escopo: "itens", campo: `${tag}.valor_unitario`, mensagem: `${tag}: valor unitário deve ser > 0.` });
    if (isBlank(it.descricao)) errs.push({ escopo: "itens", campo: `${tag}.descricao`, mensagem: `${tag}: descrição obrigatória.` });
    if (isBlank(it.unidade)) errs.push({ escopo: "itens", campo: `${tag}.unidade`, mensagem: `${tag}: unidade obrigatória.` });
  });
  return errs;
}

export function validarAmbiente(hasToken: boolean, ambiente: unknown): NfeValidationError[] {
  const errs: NfeValidationError[] = [];
  if (!hasToken) errs.push({ escopo: "ambiente", campo: "FOCUS_NFE_TOKEN", mensagem: "Token Focus NFe não configurado no backend." });
  if (!["homologacao", "producao"].includes(String(ambiente ?? "")))
    errs.push({ escopo: "ambiente", campo: "ambiente_nfe", mensagem: "Ambiente NF-e não definido." });
  return errs;
}

export function validarEmissao(input: {
  empresa: Rec | null;
  cliente: Rec | null;
  itens: Rec[] | null;
  hasToken: boolean;
}): NfeValidationError[] {
  return [
    ...validarAmbiente(input.hasToken, input.empresa?.ambiente_nfe),
    ...validarEmpresa(input.empresa),
    ...validarCliente(input.cliente),
    ...validarItens(input.itens),
  ];
}

export function formatarErrosParaUsuario(errs: NfeValidationError[]): string {
  if (errs.length === 0) return "";
  const grupos: Record<string, string[]> = {};
  for (const e of errs) (grupos[e.escopo] ??= []).push(`• ${e.mensagem}`);
  const rotulos: Record<string, string> = {
    ambiente: "Ambiente/Token", empresa: "Empresa", cliente: "Destinatário", itens: "Itens",
  };
  return Object.entries(grupos)
    .map(([k, v]) => `${rotulos[k] ?? k}:\n${v.join("\n")}`)
    .join("\n\n");
}
