export type HelpContent = {
  id: string;
  summary: string;
  description: string;
  features: string[];
  permissions?: string[];
  integrations?: string[];
  bestPractices?: string[];
  tips?: string[];
  relatedModules?: string[];
};

export const HELP_REGISTRY: Record<string, HelpContent> = {
  "inicio": {
    id: "inicio",
    summary: "Visão geral e acesso rápido.",
    description: "Painel central para monitoramento de indicadores e atalhos para funções frequentes.",
    features: ["Widgets customizáveis", "Alertas críticos", "Resumo de atividades"],
  },
  "estoque-tecidos": {
    id: "estoque-tecidos",
    summary: "Gestão de tecidos e matérias-primas.",
    description: "Controle detalhado de saldo físico, reservado e disponível de tecidos em estoque.",
    features: ["Controle por lote", "Rastreabilidade de rolos", "Gestão de localizações"],
  },
  "producao-op": {
    id: "producao-op",
    summary: "Gestão de Ordens de Produção.",
    description: "Criação, acompanhamento e encerramento de OPs para o chão de fábrica.",
    features: ["Explosão de materiais", "Cronograma de produção", "Apontamento de consumo"],
  },
  "financeiro": {
    id: "financeiro",
    summary: "Contas a receber e gestão financeira.",
    description: "Módulo para controle de faturamento, recebíveis e conciliação bancária.",
    features: ["Baixas automáticas", "Integração com bancos", "Fluxo de caixa"],
  },
  "fiscal-nota-fiscal": {
    id: "fiscal-nota-fiscal",
    summary: "Emissão de Notas Fiscais (NF-e).",
    description: "Gestão completa do ciclo de vida das notas fiscais de venda e remessa.",
    features: ["Geração de XML", "Impressão de DANFE", "Cálculo de impostos"],
  },
  "pcp-mrp": {
    id: "pcp-mrp",
    summary: "Planejamento de Necessidades de Materiais.",
    description: "Cálculo automático de compras e produção baseado na demanda e estoque.",
    features: ["Cálculo de necessidade líquida", "Sugestão de compras", "Reservas automáticas"],
  }
};
