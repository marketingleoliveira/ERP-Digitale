// Motor Tributário — tipos puros (sem I/O)

export type RegimeTributario = "simples" | "presumido" | "real";
export type TipoCliente = "pj_contribuinte" | "pj_nao_contrib" | "pf" | "orgao_publico" | "exterior";
export type TipoOperacao = "venda" | "devolucao" | "remessa" | "retorno" | "bonif" | "amostra" | "industrializacao" | "exportacao";
export type Finalidade = "consumo" | "revenda" | "industrializacao" | "ativo";

export interface RegraTributaria {
  id: string;
  nome: string;
  prioridade: number;
  ativo: boolean;
  uf_origem: string | null;
  uf_destino: string | null;
  regime_tributario_emitente: RegimeTributario | null;
  tipo_cliente: TipoCliente | null;
  tipo_operacao: TipoOperacao | null;
  ncm_prefix: string | null;
  cest: string | null;
  finalidade: Finalidade | null;
  cfop: string;
  cst_icms: string | null;
  csosn: string | null;
  aliq_icms: number;
  red_base_icms_pct: number;
  calcula_st: boolean;
  mva_pct: number;
  aliq_icms_st: number;
  aliq_fcp: number;
  aliq_fcp_st: number;
  cst_ipi: string | null;
  aliq_ipi: number;
  cst_pis: string | null;
  aliq_pis: number;
  cst_cofins: string | null;
  aliq_cofins: number;
  calcula_difal: boolean;
  observacao: string | null;
}

export interface UfAliquota {
  sigla: string;
  icms_interno_pct: number;
  icms_interestadual_pct: number;
  icms_st_pct: number;
  fundo_pobreza_pct: number;
}

export interface TaxContext {
  emitente: { uf: string; regime: RegimeTributario };
  destinatario: {
    uf: string;
    tipo_cliente: TipoCliente;
    consumidor_final: boolean;
  };
  operacao: TipoOperacao;
  finalidade: Finalidade;
  regras: RegraTributaria[];
  uf_aliquotas: UfAliquota[];
}

export interface ItemInput {
  descricao: string;
  ncm: string;
  cest: string | null;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  frete: number;
  outras: number;
  seguro: number;
}

export interface ItemResult {
  descricao: string;
  ncm: string;
  cfop: string;
  cst_icms: string | null;
  csosn: string | null;
  valor_produtos: number;
  base_icms: number;
  aliq_icms: number;
  valor_icms: number;
  base_icms_st: number;
  aliq_icms_st: number;
  valor_icms_st: number;
  valor_fcp: number;
  valor_fcp_st: number;
  valor_difal: number;
  base_ipi: number;
  aliq_ipi: number;
  valor_ipi: number;
  cst_ipi: string | null;
  base_pis: number;
  aliq_pis: number;
  valor_pis: number;
  cst_pis: string | null;
  base_cofins: number;
  aliq_cofins: number;
  valor_cofins: number;
  cst_cofins: string | null;
  valor_total: number;
  regra_aplicada: string | null;
  avisos: string[];
}

export interface TotaisNota {
  valor_produtos: number;
  valor_desconto: number;
  valor_frete: number;
  valor_seguro: number;
  valor_outras: number;
  base_icms: number;
  valor_icms: number;
  base_icms_st: number;
  valor_icms_st: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_fcp: number;
  valor_fcp_st: number;
  valor_difal: number;
  valor_total: number;
}
