// Dados fictícios para demonstração do Sistema Digitale Têxtil

export const kpis = {
  faturamentoHoje: 48350.9,
  faturamentoMes: 1287640.55,
  pedidosProducao: 42,
  pedidosAtrasados: 5,
  ordensAbertas: 18,
  estoqueDisponivel: 128430,
  clientesAtivos: 312,
  contasReceber: 385920.4,
  contasPagar: 214560.15,
  metaMes: 1500000,
};

export const vendasSemana = [
  { dia: "Seg", valor: 42000 },
  { dia: "Ter", valor: 51200 },
  { dia: "Qua", valor: 38900 },
  { dia: "Qui", valor: 61300 },
  { dia: "Sex", valor: 72500 },
  { dia: "Sáb", valor: 28900 },
  { dia: "Dom", valor: 12400 },
];

export const faturamentoMensal = [
  { mes: "Jan", receita: 980000, despesa: 720000 },
  { mes: "Fev", receita: 1120000, despesa: 810000 },
  { mes: "Mar", receita: 1050000, despesa: 790000 },
  { mes: "Abr", receita: 1240000, despesa: 860000 },
  { mes: "Mai", receita: 1380000, despesa: 920000 },
  { mes: "Jun", receita: 1287640, despesa: 890000 },
];

export const producaoStatus = [
  { name: "Em produção", value: 42, color: "var(--color-chart-1)" },
  { name: "Aguardando", value: 18, color: "var(--color-chart-2)" },
  { name: "Concluídos", value: 87, color: "var(--color-chart-3)" },
  { name: "Atrasados", value: 5, color: "var(--color-chart-4)" },
];

export const produtosMaisVendidos = [
  { nome: "Malha PV Estampa Floral", qtd: 4820, receita: 128430 },
  { nome: "Tecido Oxford Liso Marinho", qtd: 3210, receita: 96300 },
  { nome: "Camiseta Dry Fit Personalizada", qtd: 2890, receita: 86700 },
  { nome: "Tecido Suplex Estampado", qtd: 2410, receita: 72300 },
  { nome: "Aviamento Zíper 20cm", qtd: 12500, receita: 25000 },
];

export type Cliente = {
  id: string;
  nome: string;
  tipo: "PJ" | "PF";
  documento: string;
  cidade: string;
  uf: string;
  segmento: string;
  vendedor: string;
  limite: number;
  status: "Ativo" | "Inativo" | "Bloqueado";
};

export const clientes: Cliente[] = [
  { id: "C-0001", nome: "Confecções Bella Moda LTDA", tipo: "PJ", documento: "12.345.678/0001-90", cidade: "São Paulo", uf: "SP", segmento: "Confecção", vendedor: "Ana Souza", limite: 80000, status: "Ativo" },
  { id: "C-0002", nome: "Estampas Criativas ME", tipo: "PJ", documento: "23.456.789/0001-01", cidade: "Curitiba", uf: "PR", segmento: "Estamparia", vendedor: "Carlos Lima", limite: 45000, status: "Ativo" },
  { id: "C-0003", nome: "João Batista Alves", tipo: "PF", documento: "123.456.789-00", cidade: "Belo Horizonte", uf: "MG", segmento: "Revenda", vendedor: "Ana Souza", limite: 15000, status: "Ativo" },
  { id: "C-0004", nome: "Private Label Fashion S.A.", tipo: "PJ", documento: "34.567.890/0001-12", cidade: "Rio de Janeiro", uf: "RJ", segmento: "Private Label", vendedor: "Marcos Reis", limite: 150000, status: "Ativo" },
  { id: "C-0005", nome: "Distribuidora Têxtil Sul", tipo: "PJ", documento: "45.678.901/0001-23", cidade: "Porto Alegre", uf: "RS", segmento: "Distribuidor", vendedor: "Carlos Lima", limite: 200000, status: "Ativo" },
  { id: "C-0006", nome: "Maria Fernanda Costa", tipo: "PF", documento: "234.567.890-11", cidade: "Recife", uf: "PE", segmento: "Revenda", vendedor: "Marcos Reis", limite: 8000, status: "Bloqueado" },
  { id: "C-0007", nome: "Malharia União LTDA", tipo: "PJ", documento: "56.789.012/0001-34", cidade: "Blumenau", uf: "SC", segmento: "Confecção", vendedor: "Ana Souza", limite: 120000, status: "Ativo" },
  { id: "C-0008", nome: "Fashion Kids ME", tipo: "PJ", documento: "67.890.123/0001-45", cidade: "Fortaleza", uf: "CE", segmento: "Confecção", vendedor: "Carlos Lima", limite: 35000, status: "Inativo" },
];

export type Produto = {
  id: string;
  sku: string;
  nome: string;
  categoria: string;
  colecao: string;
  gramatura: string;
  largura: string;
  composicao: string;
  preco: number;
  estoque: number;
  status: "Ativo" | "Inativo";
};

export const produtos: Produto[] = [
  { id: "P-0001", sku: "MPV-FLR-001", nome: "Malha PV Estampa Floral", categoria: "Tecido", colecao: "Verão 26", gramatura: "180g/m²", largura: "1,60m", composicao: "67% PES / 33% VIS", preco: 32.9, estoque: 4820, status: "Ativo" },
  { id: "P-0002", sku: "OXF-MAR-002", nome: "Tecido Oxford Liso Marinho", categoria: "Tecido", colecao: "Corporativo", gramatura: "140g/m²", largura: "1,50m", composicao: "100% PES", preco: 24.5, estoque: 3210, status: "Ativo" },
  { id: "P-0003", sku: "CAM-DRY-003", nome: "Camiseta Dry Fit Personalizada", categoria: "Produto Acabado", colecao: "Sport 26", gramatura: "150g/m²", largura: "-", composicao: "92% PES / 8% EL", preco: 45.0, estoque: 2890, status: "Ativo" },
  { id: "P-0004", sku: "SUP-EST-004", nome: "Tecido Suplex Estampado", categoria: "Tecido", colecao: "Fitness", gramatura: "220g/m²", largura: "1,50m", composicao: "88% PA / 12% EL", preco: 38.9, estoque: 2410, status: "Ativo" },
  { id: "P-0005", sku: "AVI-ZIP-005", nome: "Aviamento Zíper 20cm", categoria: "Aviamento", colecao: "-", gramatura: "-", largura: "-", composicao: "Nylon", preco: 2.0, estoque: 12500, status: "Ativo" },
  { id: "P-0006", sku: "TEC-ALG-006", nome: "Tecido Algodão Cru", categoria: "Matéria-prima", colecao: "-", gramatura: "160g/m²", largura: "1,60m", composicao: "100% Algodão", preco: 21.5, estoque: 850, status: "Ativo" },
];

export type OrdemProducao = {
  id: string;
  produto: string;
  cliente: string;
  quantidade: number;
  produzida: number;
  status: "Aguardando" | "Corte" | "Estampa" | "Costura" | "Acabamento" | "Concluído";
  prioridade: "Baixa" | "Média" | "Alta" | "Urgente";
  prazo: string;
  responsavel: string;
};

export const ordens: OrdemProducao[] = [
  { id: "OP-1042", produto: "Camiseta Dry Fit Personalizada", cliente: "Bella Moda", quantidade: 500, produzida: 120, status: "Corte", prioridade: "Alta", prazo: "2026-07-05", responsavel: "Equipe A" },
  { id: "OP-1043", produto: "Malha PV Estampa Floral", cliente: "Estampas Criativas", quantidade: 800, produzida: 800, status: "Concluído", prioridade: "Média", prazo: "2026-07-02", responsavel: "Equipe B" },
  { id: "OP-1044", produto: "Tecido Suplex Estampado", cliente: "Private Label Fashion", quantidade: 1200, produzida: 640, status: "Estampa", prioridade: "Urgente", prazo: "2026-07-03", responsavel: "Equipe C" },
  { id: "OP-1045", produto: "Camiseta Dry Fit Personalizada", cliente: "Distribuidora Sul", quantidade: 300, produzida: 0, status: "Aguardando", prioridade: "Média", prazo: "2026-07-10", responsavel: "Equipe A" },
  { id: "OP-1046", produto: "Tecido Oxford Liso Marinho", cliente: "Malharia União", quantidade: 600, produzida: 300, status: "Costura", prioridade: "Baixa", prazo: "2026-07-15", responsavel: "Equipe B" },
  { id: "OP-1047", produto: "Malha PV Estampa Floral", cliente: "Fashion Kids", quantidade: 450, produzida: 380, status: "Acabamento", prioridade: "Alta", prazo: "2026-07-04", responsavel: "Equipe A" },
  { id: "OP-1048", produto: "Camiseta Dry Fit Personalizada", cliente: "Bella Moda", quantidade: 250, produzida: 50, status: "Corte", prioridade: "Média", prazo: "2026-07-08", responsavel: "Equipe C" },
];

export type Pedido = {
  id: string;
  cliente: string;
  data: string;
  valor: number;
  status: "Orçamento" | "Aprovado" | "Separação" | "Faturado" | "Expedido" | "Entregue";
  vendedor: string;
};

export const pedidos: Pedido[] = [
  { id: "PV-5021", cliente: "Confecções Bella Moda", data: "2026-06-28", valor: 32450, status: "Faturado", vendedor: "Ana Souza" },
  { id: "PV-5022", cliente: "Estampas Criativas", data: "2026-06-29", valor: 18920, status: "Separação", vendedor: "Carlos Lima" },
  { id: "PV-5023", cliente: "Private Label Fashion", data: "2026-06-30", valor: 87300, status: "Aprovado", vendedor: "Marcos Reis" },
  { id: "PV-5024", cliente: "Distribuidora Sul", data: "2026-07-01", valor: 124800, status: "Orçamento", vendedor: "Ana Souza" },
  { id: "PV-5025", cliente: "Malharia União", data: "2026-06-27", valor: 45600, status: "Expedido", vendedor: "Carlos Lima" },
  { id: "PV-5026", cliente: "Fashion Kids", data: "2026-06-25", valor: 12300, status: "Entregue", vendedor: "Marcos Reis" },
];

export const notificacoes = [
  { id: 1, tipo: "warning", titulo: "Estoque baixo", desc: "Tecido Algodão Cru abaixo do mínimo (850 un.)", tempo: "há 12 min" },
  { id: 2, tipo: "error", titulo: "Pedido atrasado", desc: "OP-1044 excedeu o prazo previsto", tempo: "há 1h" },
  { id: 3, tipo: "success", titulo: "Meta atingida", desc: "Vendedora Ana Souza atingiu 105% da meta", tempo: "há 3h" },
  { id: 4, tipo: "info", titulo: "Nova solicitação de compra", desc: "SC-2201 aguarda aprovação", tempo: "há 5h" },
];

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export const formatInt = (v: number) => v.toLocaleString("pt-BR");
