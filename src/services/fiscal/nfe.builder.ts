/**
 * Construtor de payloads NF-e a partir dos dados do ERP.
 * Reutiliza tabelas existentes: empresa, customers, products, notas_fiscais.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = Record<string, any>;

export function buildFocusNfePayload(empresa: AnyRec, nota: AnyRec, itens: AnyRec[], destinatario: AnyRec | null) {
  const cnpjEmit = (empresa.cnpj ?? "").replace(/\D/g, "");
  const cepEmit = (empresa.cep ?? "").replace(/\D/g, "");
  const destCnpjCpf = (destinatario?.cnpj ?? destinatario?.cpf ?? "").replace(/\D/g, "");

  return {
    natureza_operacao: nota.natureza_operacao ?? "Venda de mercadoria",
    data_emissao: nota.data_emissao,
    data_entrada_saida: nota.data_emissao,
    tipo_documento: nota.tipo === "entrada" ? 0 : 1,
    finalidade_emissao: nota.finalidade === "Devolução" ? 4 : nota.finalidade === "Complementar" ? 2 : 1,
    consumidor_final: destinatario?.consumidor_final ? 1 : 0,
    presenca_comprador: destinatario?.indicador_presenca ?? 1,

    cnpj_emitente: cnpjEmit,
    nome_emitente: empresa.razao_social,
    nome_fantasia_emitente: empresa.nome_fantasia,
    logradouro_emitente: empresa.logradouro,
    numero_emitente: empresa.numero,
    bairro_emitente: empresa.bairro,
    municipio_emitente: empresa.cidade,
    uf_emitente: empresa.uf,
    cep_emitente: cepEmit,
    inscricao_estadual_emitente: empresa.inscricao_estadual,
    regime_tributario_emitente: empresa.crt ?? (empresa.regime_tributario === "simples" ? 1 : 3),

    ...(destinatario ? {
      [destCnpjCpf.length === 14 ? "cnpj_destinatario" : "cpf_destinatario"]: destCnpjCpf,
      nome_destinatario: destinatario.razao_social ?? destinatario.nome_fantasia,
      logradouro_destinatario: destinatario.logradouro ?? destinatario.endereco,
      numero_destinatario: destinatario.numero,
      bairro_destinatario: destinatario.bairro,
      municipio_destinatario: destinatario.cidade,
      uf_destinatario: destinatario.uf,
      cep_destinatario: (destinatario.cep ?? "").replace(/\D/g, ""),
      inscricao_estadual_destinatario: destinatario.inscricao_estadual,
      indicador_inscricao_estadual_destinatario: destinatario.indicador_ie ?? 9,
      email_destinatario: destinatario.email,
    } : {}),

    valor_total: Number(nota.valor_total ?? 0),
    valor_produtos: Number(nota.valor_produtos ?? nota.valor_total ?? 0),
    valor_frete: Number(nota.valor_frete ?? 0),
    valor_desconto: Number(nota.valor_desconto ?? 0),
    modalidade_frete: nota.modalidade_frete ?? 9,

    items: itens.map((i, idx) => ({
      numero_item: idx + 1,
      codigo_produto: i.produto_codigo ?? i.produto_id ?? `ITEM${idx + 1}`,
      descricao: i.descricao ?? "",
      codigo_ncm: i.ncm ?? "00000000",
      cfop: i.cfop ?? "5102",
      unidade_comercial: i.unidade ?? "UN",
      quantidade_comercial: Number(i.qtd_saida ?? i.quantidade ?? 1),
      valor_unitario_comercial: Number(i.valor_unitario ?? 0),
      valor_bruto: Number(i.valor_total ?? 0),
      unidade_tributavel: i.unidade_tributavel ?? i.unidade ?? "UN",
      quantidade_tributavel: Number(i.qtd_saida ?? i.quantidade ?? 1),
      valor_unitario_tributavel: Number(i.valor_unitario ?? 0),
      icms_origem: i.origem ?? 0,
      icms_situacao_tributaria: i.cst_icms ?? i.csosn ?? "102",
      icms_aliquota: Number(i.aliq_icms ?? 0),
      pis_situacao_tributaria: i.cst_pis ?? "07",
      cofins_situacao_tributaria: i.cst_cofins ?? "07",
    })),
  };
}
