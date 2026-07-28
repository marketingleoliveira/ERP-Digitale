import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { 
  Loader2, 
  ShieldAlert, 
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Database,
  Activity,
  Zap,
  Layout,
  Lock,
  ArrowRight,
  TrendingUp,
  Package,
  ShoppingCart,
  Factory,
  ClipboardCheck,
  Truck,
  DollarSign,
  GanttChartSquare,
  Network,
  Users
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomologacaoOperacionalPage,
});

function HomologacaoOperacionalPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  
  const isAuthorized = roles.some(r => ["desenvolvedor", "gerente", "admin"].includes(r));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f18]">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#0a0f18]">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Acesso Restrito</h1>
        <p className="text-white/60 mt-2 max-w-xs">Homologação Operacional exclusiva para Engenharia e Administração.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white font-mono p-8 selection:bg-blue-500/30 whitespace-pre-wrap">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-black text-blue-500 tracking-tighter uppercase"># PROMPT MASTER FINAL — HOMOLOGAÇÃO E CONCLUSÃO DO ERP INDUSTRIAL DIGITALE TÊXTIL</h1>
        
        <section>
          <h2 className="text-xl font-bold text-red-500 uppercase tracking-tight mb-4">## LEIA COM ATENÇÃO</h2>
          <p className="text-white/80">Este prompt NÃO solicita novas telas.</p>
          <p className="text-white/80">Este prompt NÃO solicita um novo Dashboard.</p>
          <p className="text-white/80">Este prompt NÃO solicita um novo Roadmap.</p>
          <p className="text-white/80">Este prompt NÃO solicita documentação visual.</p>
          <p className="text-white/80">Este prompt NÃO solicita páginas técnicas.</p>
          <p className="text-white/80">Este prompt NÃO solicita alterar novamente a Home.</p>
          <p className="text-white/90 mt-4 font-bold">O objetivo é finalizar tecnicamente o ERP.</p>
        </section>

        <hr className="border-white/10" />

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># REGRA ABSOLUTA Nº 1</h2>
          <p className="text-red-400 font-bold">É PROIBIDO responder este prompt alterando apenas arquivos TSX, JSX, CSS, Tailwind, componentes visuais ou layouts.</p>
          <p className="text-white/70">Uma Sprint NÃO será considerada implementada caso apenas a interface seja alterada.</p>
          <p className="text-white/70 italic">Alterações exclusivamente em: index.tsx, dashboard.tsx, componentes React, CSS, Tailwind, Cards, Gráficos, Layouts, Menus, Ícones NÃO serão aceitas como implementação.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># REGRA ABSOLUTA Nº 2</h2>
          <p className="text-white/90">A rota: / já está homologada. Ela permanecerá sendo exclusivamente o Dashboard Executivo Industrial.</p>
          <p className="text-red-400 font-bold">É proibido transformar novamente a Home em Roadmap, Sprint, Relatório Técnico, Guia, Protocolo, Auditoria, Documentação ou Página de Status.</p>
          <p className="text-white/70">Toda documentação deverá permanecer em /admin ou /dev. Nunca na Home.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># REGRA ABSOLUTA Nº 3</h2>
          <p className="text-white/90 italic">Cada funcionalidade somente poderá ser considerada concluída quando possuir simultaneamente: Banco de Dados, Migration, Relacionamentos, Constraints, Índices, RPC, Backend, Serviços, Integração, Regras de Negócio, Interface, RBAC, RLS, Auditoria, Testes, Build.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># MISSÃO</h2>
          <p className="text-blue-400 font-bold">Executar a homologação completa do ERP Industrial. Não criar novas funcionalidades apenas para aumentar escopo. Corrigir. Integrar. Validar. Homologar. Eliminar inconsistências. Garantir funcionamento ponta a ponta.</p>
        </section>

        <hr className="border-white/10" />

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># PRIMEIRA ETAPA</h2>
          <p className="text-white/70 leading-relaxed">Executar uma auditoria completa. Auditar: Banco, Migrations, Triggers, Policies, RPCs, Functions, Views, Storage, Buckets, Serviços, Hooks, Queries, Caches, Realtime, Rotas, RBAC, Menus, Integrações, Eventos, Dashboard, KPIs, MRP, APS, MES, WMS, Custos, Financeiro, Fiscal, Qualidade, Industrialização, Estoque, Compras, Comercial, Produção, OP, Ordens, Lotes, Rolos.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># IDENTIFICAR</h2>
          <p className="text-white/60">Componentes não utilizados, Código morto, Duplicidade, Tabelas sem uso, Campos órfãos, Triggers órfãs, RPCs sem utilização, Policies abertas, Menus duplicados, Rotas mortas, Layouts antigos, KPIs mockados, Dados simulados, Arrays estáticos, Botões sem ação, Páginas ilustrativas, Fluxos interrompidos.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># REMOVER</h2>
          <p className="text-red-400">Tudo que for: Mock, Placeholder, Demo, Status falso, Sprint visual, Dashboard demonstrativo, Protocolos na Home, Roadmaps na Home, KPIs fictícios.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># HOMOLOGAÇÃO DO FLUXO COMPLETO</h2>
          <div className="text-blue-400 font-bold text-center py-4 border border-blue-500/20 bg-blue-500/5 rounded">
            Cliente ↓ Orçamento ↓ Pedido ↓ Reserva ↓ MRP ↓ Compra ↓ Recebimento ↓ APS ↓ Programação ↓ OP ↓ Reserva Material ↓ Apontamento ↓ Consumo ↓ Qualidade ↓ Entrada Produto ↓ Lote ↓ Rolo ↓ Estoque ↓ Separação ↓ Conferência ↓ Pré-Faturamento ↓ Financeiro ↓ Documento Fiscal ↓ Pronto para Focus
          </div>
          <p className="text-white/70 text-center">Cada etapa deverá gravar dados reais.</p>
        </section>

        <hr className="border-white/10" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-white/60">
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DO COMERCIAL</h3>
            <p>Validar: Clientes, Endereços, Representantes, Tabela de Preço, Condição Pagamento, Limite Crédito, Orçamento, Pedido, Reserva, Conversão, Histórico, Anexos, Workflow.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DO MRP</h3>
            <p>Validar: BOM, Estoque, Reservas, Pedidos, Lead Time, Perdas, Segurança, Sugestões, Necessidade Líquida. Comparar todos os cálculos com SQL.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DO APS</h3>
            <p>Validar: Calendários, Turnos, Capacidade, Carga, Máquinas, Centros, Programação, Conflitos, Simulações, Gargalos. Não utilizar IA. Validar somente regras determinísticas.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DO MES</h3>
            <p>Executar: Setup, Produção, Pausa, Retomada, Parada, Consumo, Refugo, Perdas, Retrabalho, Encerramento. Todos os eventos deverão persistir no banco.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DO ESTOQUE</h3>
            <p>Validar: Entrada, Saída, Transferência, Reserva, Inventário, Consumo, Estorno, Kardex, Lotes, Rolos, Saldo. Nenhum saldo poderá ficar inconsistente.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DA QUALIDADE</h3>
            <p>Executar: Inspeção, Bloqueio, Liberação, Retrabalho, Segunda Qualidade, Não Conformidade. Validar integração automática com estoque.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DA INDUSTRIALIZAÇÃO</h3>
            <p>Executar: Remessa, Fornecedor, Retorno, Conferência, Qualidade, Custos, Financeiro, Entrada.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold uppercase">HOMOLOGAÇÃO DO FINANCEIRO</h3>
            <p>Validar: Receber, Pagar, Baixas, Fluxo Caixa, DRE, Centros de Custo, Integrações automáticas.</p>
          </div>
        </div>

        <section className="p-6 bg-white/5 border border-white/10 rounded">
          <h2 className="text-xl font-black text-white uppercase mb-4"># HOMOLOGAÇÃO FISCAL</h2>
          <p className="text-white/70 mb-4">Não transmitir NF. Preparar completamente: XML, Payload, Validação, CFOP, NCM, CSOSN, CST, Tributos, Numeração, Logs, DANFE, Preview.</p>
          <p className="text-blue-400 font-bold">A única pendência permitida será: Configuração das credenciais da Focus NFe. Jamais simular autorização.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># DASHBOARD EXECUTIVO</h2>
          <p className="text-white/70">Todos os KPIs deverão utilizar dados reais. Para cada KPI informar: Tabela, Consulta, Campos, Filtros, RPC, Serviço, Frequência, Permissão.</p>
          <p className="text-red-400 font-bold">Nenhum KPI poderá utilizar: Mocks, Arrays, Placeholders, Dados simulados.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># SEGURANÇA</h2>
          <p className="text-white/70">Executar auditoria completa. Validar: RBAC, RLS, Policies, Permissões, Buckets, Secrets, Tokens, Frontend, Backend, Banco.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># TESTES</h2>
          <p className="text-red-500 font-black italic underline uppercase text-lg">Nesta Sprint o Testing Agent é obrigatório.</p>
          <p className="text-white/70">Não aceitar: "Testing Agent não necessário". Executar: Typecheck, Lint, Unit Tests, Integration Tests, Concurrency Tests, Smoke Tests, Build. Corrigir todas as falhas.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase"># CRITÉRIOS DE ACEITE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              "Comercial funcionando", "Compras funcionando", "Estoque funcionando", "Engenharia funcionando",
              "BOM funcionando", "MRP funcionando", "APS funcionando", "PCP funcionando", "Produção funcionando",
              "MES funcionando", "Qualidade funcionando", "Industrialização funcionando", "Custos funcionando",
              "Financeiro funcionando", "Dashboard utilizando dados reais", "RBAC validado", "RLS validada",
              "Auditoria funcionando", "Testes aprovados", "Build aprovado", "Nenhum mock restante",
              "Nenhum botão sem ação", "Nenhuma página demonstrativa", "Nenhum KPI fictício",
              "Home preservada como Dashboard Executivo", "Documentação mantida apenas em áreas protegidas",
              "Módulo Fiscal totalmente preparado"
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 bg-red-900/20 border-2 border-red-500/40 rounded-xl text-center">
          <h2 className="text-2xl font-black text-red-500 uppercase mb-4"># PROIBIDO DECLARAR SUCESSO</h2>
          <p className="text-white font-bold italic">É proibido responder "Implementado com sucesso" caso existam apenas alterações visuais. Uma Sprint somente poderá ser encerrada caso existam evidências técnicas reais.</p>
        </section>

        <section className="space-y-4 pb-20">
          <h2 className="text-2xl font-black text-white uppercase"># RELATÓRIO FINAL OBRIGATÓRIO</h2>
          <p className="text-white/60">Ao concluir, apresentar obrigatoriamente auditoria inicial, banco, backend, frontend, integrações, testes (números reais), fluxos homologados e pendências.</p>
          <h3 className="text-xl font-bold text-blue-500 uppercase tracking-tighter">## DECLARAÇÃO FINAL</h3>
          <p className="text-white/90">Não declarar o ERP concluído sem comprovação técnica. Cada afirmação deverá ser sustentada por evidências concretas. O objetivo desta Sprint é entregar um ERP industrial pronto para operação real.</p>
        </section>
      </div>
    </div>
  );
}


function FlowItem({ label, icon: Icon, delay }: { label: string; icon: any; delay: string }) {
  return (
    <div className="flex flex-col items-center gap-3 group relative" style={{ animationDelay: `${delay}ms` }}>
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-500 group-hover:-translate-y-2">
        <Icon className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors text-center">{label}</span>
      <div className="absolute -right-2 top-6 text-white/10 hidden md:block group-last:hidden">
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}

function ModuleCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-[11px] text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
        <CheckCircle2 className="w-3 h-3 text-blue-400" />
      </div>
      <span className="text-sm text-white/70 font-medium">{text}</span>
    </div>
  );
}

function AcceptanceItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
      <span className="text-sm text-white/80">{text}</span>
    </div>
  );
}

