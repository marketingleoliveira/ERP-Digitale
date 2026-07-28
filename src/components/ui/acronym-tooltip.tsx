import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const acronyms: Record<string, string> = {
  "BOM": "Bill of Materials - Lista detalhada de componentes e insumos necessários para fabricar um produto.",
  "MRP": "Material Requirement Planning - Planejamento de Necessidades de Materiais.",
  "NFe": "Nota Fiscal Eletrônica - Documento fiscal digital que substitui a nota física.",
  "NF-e": "Nota Fiscal Eletrônica - Documento fiscal digital que substitui a nota física.",
  "CFOP": "Código Fiscal de Operações e Prestações - Identifica a natureza da circulação da mercadoria.",
  "NCM": "Nomenclatura Comum do Mercosul - Código que identifica a natureza das mercadorias.",
  "ICMS": "Imposto sobre Circulação de Mercadorias e Serviços.",
  "IPI": "Imposto sobre Produtos Industrializados.",
  "PIS": "Programa de Integração Social - Tributo federal.",
  "COFINS": "Contribuição para o Financiamento da Seguridade Social.",
  "CSLL": "Contribuição Social sobre o Lucro Líquido.",
  "ISS": "Imposto Sobre Serviços.",
  "UUID": "Universally Unique Identifier - Identificador único de 128 bits.",
  "JWT": "JSON Web Token - Padrão para autenticação segura entre partes.",
  "RPC": "Remote Procedure Call - Chamada de função executada no servidor.",
  "RLS": "Row Level Security - Segurança em nível de linha no banco de dados.",
  "PK": "Primary Key - Chave primária que identifica um registro único.",
  "FK": "Foreign Key - Chave estrangeira que vincula tabelas.",
  "E2E": "End-to-End - Testes que simulam a jornada completa do usuário.",
  "TDD": "Test Driven Development - Desenvolvimento orientado a testes.",
  "CRUD": "Create, Read, Update, Delete - Operações básicas de manipulação de dados.",
  "PCP": "Planejamento e Controle da Produção.",
  "OP": "Ordem de Produção.",
  "CST": "Código de Situação Tributária.",
  "CRT": "Código de Regime Tributário.",
  "CEST": "Código Especificador da Substituição Tributária - Identifica mercadorias sujeitas à substituição tributária.",
  "DANFE": "Documento Auxiliar da Nota Fiscal Eletrônica - Representação gráfica da NF-e.",
  "XML": "Extensible Markup Language - Formato de arquivo da nota fiscal.",
  "SEFAZ": "Secretaria da Fazenda.",
  "FIFO": "First In, First Out - Primeiro que entra, primeiro que sai (controle de estoque).",
  "IBGE": "Instituto Brasileiro de Geografia e Estatística - Provedor de códigos de cidades e estados.",
  "GTIN": "Global Trade Item Number - Código de barras do produto (antigo EAN).",
  "DAPI": "Demonstrativo de Apuração do ICMS.",
  "GIA": "Guia de Informação e Apuração do ICMS.",
  "EFD": "Escrituração Fiscal Digital - Parte do projeto SPED.",
  "SPED": "Sistema Público de Escrituração Digital.",
  "CTE": "Conhecimento de Transporte Eletrônico.",
  "MDFE": "Manifesto Eletrônico de Documentos Fiscais.",
  "REINF": "Erituração Fiscal Digital de Retenções e Outras Informações Fiscais.",
  "E-SOCIAL": "Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas.",
  "Kardex": "Ficha de controle de movimentação física e financeira de estoque.",
  "Lote": "Identificador de uma quantidade específica de produto fabricado ou recebido de uma vez.",
  "RNC": "Relatório de Não Conformidade - Documento para registrar desvios de qualidade.",
  "OEE": "Overall Equipment Effectiveness - Eficácia Global do Equipamento.",
  "Setup": "Tempo de preparação de uma máquina para iniciar a produção de um novo item.",
  "Lead Time": "Tempo total entre o pedido e a entrega ou conclusão de um processo.",
  "MES": "Manufacturing Execution System - Sistemas focados na execução e controle da produção em tempo real.",
  "HEARTBEAT": "Batimento - Sinal periódico enviado pelo agente para confirmar que está online e funcional.",
  "RBAC": "Role-Based Access Control - Controle de acesso baseado em cargos ou funções do usuário.",
}

interface AcronymTooltipProps {
  children: string;
}

export function AcronymTooltip({ children }: AcronymTooltipProps) {
  const definition = acronyms[children.toUpperCase()];

  if (!definition) {
    return <span>{children}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className="cursor-help underline decoration-dotted underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors inline-flex items-center"
            tabIndex={0}
            role="help"
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
