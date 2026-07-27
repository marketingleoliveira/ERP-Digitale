import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-8 prose dark:prose-invert max-w-none">
      <h1>ERP INDUSTRIAL — FASE 2 (MRP, PCP, Compras, Custos e Fluxo Produtivo)</h1>
      <p>Atue como um Arquiteto de Software Sênior especializado em ERP Industrial, PostgreSQL, Supabase, TanStack Start, React 19, TypeScript e Lovable.</p>
      
      <h2>CONTEXTO</h2>
      <p>O ERP já possui implementado:</p>
      <ul>
        <li>Autenticação Supabase</li>
        <li>RBAC</li>
        <li>Módulo de Produção</li>
        <li>Ordens de Produção</li>
        <li>Cadastro de Artigos</li>
        <li>Cadastro de Produtos</li>
        <li>Cadastro de Matérias-primas</li>
        <li>Cadastro de Máquinas</li>
        <li>Cadastro de Lotes</li>
        <li>Ficha Técnica (BOM)</li>
        <li>Explosão de BOM multi-nível</li>
        <li>RPC explode_bom()</li>
        <li>MRP</li>
        <li>Planejamento</li>
        <li>Views auxiliares</li>
        <li>Dashboard de Produção</li>
        <li>Estoque</li>
        <li>Reservas</li>
        <li>Pedidos de Compra</li>
        <li>Movimentações</li>
        <li>Auditoria</li>
        <li>Interfaces React completas</li>
        <li>TanStack Router</li>
        <li>shadcn/ui</li>
      </ul>
      <p>A implementação atual foi auditada e encontra-se aprovada.</p>

      <h2>REGRA MAIS IMPORTANTE</h2>
      <p>NÃO implemente nada antes de analisar completamente o projeto.</p>
      <p>Primeiro faça uma auditoria automática.</p>
      <p>Identifique:</p>
      <ul>
        <li>tabelas existentes</li>
        <li>views</li>
        <li>RPCs</li>
        <li>triggers</li>
        <li>policies</li>
        <li>funções</li>
        <li>componentes React</li>
        <li>rotas</li>
        <li>hooks</li>
        <li>server functions</li>
        <li>migrations</li>
        <li>tipos TypeScript</li>
      </ul>
      <p>Caso alguma funcionalidade já exista:</p>
      <p>NÃO recrie. Reutilize. Refatore apenas quando necessário.</p>
      <p>Nunca duplique regras de negócio. Nunca copie lógica existente. Sempre centralize a lógica no banco ou Server Functions.</p>

      <hr />

      <h1>ETAPA 1 — REVERSE BOM (ONDE É USADO)</h1>
      <p>Implementar a engenharia reversa da BOM.</p>
      <p>Permitir selecionar qualquer componente e descobrir:</p>
      <ul>
        <li>onde é utilizado</li>
        <li>em quais artigos</li>
        <li>em quais semiacabados</li>
        <li>em quais produtos finais</li>
        <li>caminho completo</li>
        <li>nível</li>
        <li>quantidade utilizada</li>
        <li>perdas</li>
        <li>utilização direta</li>
        <li>utilização indireta</li>
      </ul>
      <p>Criar:</p>
      <ul>
        <li>função recursiva PostgreSQL</li>
        <li>interface React</li>
        <li>árvore</li>
        <li>modo consolidado</li>
        <li>filtros</li>
        <li>busca rápida</li>
      </ul>
      <p>Detectar ciclos. Evitar duplicações.</p>

      <hr />

      <h1>ETAPA 2 — MOTOR DE CUSTOS</h1>
      <p>Antes de calcular custos:</p>
      <p>Mapear todas as fontes existentes. Verificar:</p>
      <ul>
        <li>custo médio</li>
        <li>custo padrão</li>
        <li>custo da última compra</li>
        <li>custo por lote</li>
        <li>custo de movimentações</li>
        <li>custo informado manualmente</li>
        <li>custo de produção</li>
      </ul>
      <p>Nunca assumir valores inexistentes. Criar hierarquia de prioridade baseada apenas nas tabelas reais.</p>
      <p>Implementar:</p>
      <ul>
        <li>custo acumulado</li>
        <li>custo por nível</li>
        <li>custo de perdas</li>
        <li>custo total</li>
        <li>percentual</li>
        <li>materiais sem custo</li>
      </ul>
      <p>Criar nova RPC apenas se necessário.</p>

      <hr />

      <h1>ETAPA 3 — DISPONIBILIDADE</h1>
      <p>Para cada componente calcular:</p>
      <ul>
        <li>necessidade bruta</li>
        <li>perdas</li>
        <li>necessidade líquida</li>
        <li>estoque físico</li>
        <li>estoque reservado</li>
        <li>estoque bloqueado</li>
        <li>estoque disponível</li>
        <li>estoque de segurança</li>
        <li>pedidos em trânsito</li>
        <li>saldo projetado</li>
        <li>ruptura</li>
      </ul>
      <p>Classificar: disponível, parcial, ruptura, aguardando compra.</p>

      <hr />

      <h1>ETAPA 4 — SUGESTÕES DE COMPRA</h1>
      <p>Integrar MRP ao módulo Compras.</p>
      <p>Fluxo: Explosão ↓ Necessidade ↓ Disponibilidade ↓ Sugestão ↓ Aprovação ↓ Pedido</p>
      <p>Não criar pedido automaticamente. Criar apenas sugestões. Consolidar materiais iguais. Manter rastreabilidade. Criar RPCs transacionais. Gerar audit_logs.</p>

      <hr />

      <h1>ETAPA 5 — RESERVA DE ESTOQUE</h1>
      <p>Permitir reservar materiais diretamente da explosão. Somente para OP válida.</p>
      <p>Validar: usuário, RBAC, estoque, lotes, saldo, concorrência.</p>
      <p>Utilizar transações. Recalcular necessidade dentro do banco. Nunca confiar nos valores enviados pelo frontend.</p>

      <hr />

      <h1>ETAPA 6 — SCHEDULER DE PRODUÇÃO</h1>
      <p>Implementar planejamento automático.</p>
      <p>Considerar: capacidade, turnos, manutenção, setup, prioridade, atraso, disponibilidade, gargalos, máquina compatível.</p>
      <p>Modo inicial: Simulação. Nenhuma OP pode ser alterada automaticamente.</p>

      <hr />

      <h1>ETAPA 7 — CONSUMO DE ESTOQUE</h1>
      <p>Implementar: Início OP ↓ Reserva ↓ Separação ↓ Consumo previsto ↓ Consumo real ↓ Perdas ↓ Entrada do produto acabado ↓ Atualização do custo ↓ Movimentações.</p>
      <p>Tudo deve ocorrer dentro de transações.</p>

      <hr />

      <h1>ETAPA 8 — DASHBOARD EXECUTIVO</h1>
      <p>Criar indicadores de: Produção, MRP, PCP, Compras, Estoque, Lead Time, OEE, Backlog, Fila, Capacidade, Eficiência, Margem, Curva ABC, Rupturas, Custos.</p>
      <p>Utilizar Views ou Materialized Views. Evitar cálculos pesados no React.</p>

      <hr />

      <h1>ETAPA 9 — EXPORTAÇÃO</h1>
      <p>Implementar: Excel (.xlsx), PDF. Ambos devem respeitar: permissões, filtros, quantidade simulada, custos, disponibilidade, estrutura.</p>
      <p>Sem utilizar serviços externos.</p>

      <hr />

      <h1>ETAPA 10 — AUDITORIA FINAL</h1>
      <p>Antes de finalizar: Executar auditoria completa.</p>
      <p>Validar: RLS, RBAC, RPCs, Triggers, Policies, Views, Índices, Performance, Concorrência, Transações, Segurança, TanStack, Supabase, Server Functions.</p>
      <p>Identificar: duplicações, código morto, consultas desnecessárias, componentes repetidos, migrations redundantes, índices ausentes.</p>

      <hr />

      <h2>REGRAS DE IMPLEMENTAÇÃO</h2>
      <ul>
        <li>Nunca invente tabelas se já existirem equivalentes.</li>
        <li>Nunca criar migrations desnecessárias.</li>
        <li>Nunca duplicar lógica entre React e PostgreSQL.</li>
        <li>Toda regra crítica deve ficar no banco ou em Server Functions.</li>
        <li>Utilizar apenas dados reais do projeto.</li>
        <li>Respeitar completamente a arquitetura existente.</li>
        <li>Manter compatibilidade com Supabase.</li>
        <li>Utilizar TypeScript fortemente tipado.</li>
        <li>Preservar RLS.</li>
        <li>Preservar RBAC.</li>
        <li>Preservar auditoria.</li>
        <li>Utilizar transações em operações críticas.</li>
        <li>Criar índices apenas quando houver ganho comprovado.</li>
      </ul>

      <hr />

      <h2>AO FINAL DA EXECUÇÃO</h2>
      <p>Apresente um relatório contendo:</p>
      <ol>
        <li>Funcionalidades implementadas.</li>
        <li>Arquivos modificados.</li>
        <li>Novas migrations.</li>
        <li>Novas RPCs.</li>
        <li>Novas Views.</li>
        <li>Novas Policies.</li>
        <li>Novos índices.</li>
        <li>Melhorias de performance.</li>
        <li>Testes executados.</li>
        <li>Coberura funcional.</li>
        <li>Riscos encontrados.</li>
        <li>Limitações.</li>
        <li>Próximas recomendações.</li>
        <li>Classificação do ERP em percentual de maturidade para produção.</li>
      </ol>
      <p>Não considere o projeto concluído apenas porque todas as telas existem. Considere concluído somente quando todo o fluxo operacional, financeiro e produtivo estiver funcional, integrado, consistente, auditável e seguro para uso em ambiente de produção.</p>
    </div>
  );
}
