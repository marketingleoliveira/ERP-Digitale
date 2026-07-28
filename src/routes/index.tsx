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
    <div className="min-h-screen bg-[#0a0f18] text-white font-sans selection:bg-blue-500/30">
      {/* Background Decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-12 space-y-16">
        
        {/* HERO SECTION */}
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
            <Zap className="w-3 h-3 fill-blue-400" />
            Sprint Final de Homologação
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
            Homologação Operacional & <br/>
            <span className="text-blue-500">Integração Total ERP</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex-1 backdrop-blur-md">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Missão
              </h2>
              <p className="text-lg font-light leading-relaxed text-white/80 italic">
                "Validar, integrar e homologar todo o ecossistema industrial da Digitale Têxtil. Garantir que cada módulo opere como uma engrenagem única de um ERP industrial de alta performance."
              </p>
            </div>
          </div>
        </header>

        {/* REGRA DE OURO */}
        <section className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="bg-red-500 p-4 rounded-2xl shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-red-400">Regra de Ouro: Persistência Real</h2>
              <p className="text-sm text-red-200/60 max-w-2xl leading-relaxed">
                Proibido criar páginas demonstrativas, dados mockados ou placeholders. Todo desenvolvimento deve possuir persistência real no banco de dados e respeitar as permissões RLS/RBAC.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Database className="w-32 h-32" />
          </div>
        </section>

        {/* FLUXO INDUSTRIAL PONTA A PONTA */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Network className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight">Fluxo Industrial Ponta a Ponta</h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-4 relative">
              <FlowItem label="Cliente" icon={Users} delay="0" />
              <FlowItem label="Orçamento" icon={FileText} delay="100" />
              <FlowItem label="Pedido" icon={ShoppingCart} delay="200" />
              <FlowItem label="Reserva" icon={Lock} delay="300" />
              <FlowItem label="MRP" icon={Zap} delay="400" />
              <FlowItem label="Compras" icon={ShoppingCart} delay="500" />
              <FlowItem label="Recebimento" icon={Package} delay="600" />
              <FlowItem label="APS" icon={GanttChartSquare} delay="700" />
              <FlowItem label="Produção" icon={Factory} delay="800" />
              <FlowItem label="Qualidade" icon={ClipboardCheck} delay="900" />
              <FlowItem label="Expedição" icon={Truck} delay="1000" />
              <FlowItem label="Financeiro" icon={DollarSign} delay="1100" />
            </div>
            <div className="mt-12 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
               <p className="text-[10px] uppercase font-bold tracking-widest text-blue-300 text-center">
                 O sistema deve executar o ciclo completo utilizando dados reais de transação.
               </p>
            </div>
          </div>
        </section>

        {/* AUDITORIA E KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold uppercase tracking-tight">Protocolo de Auditoria</h3>
            </div>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Banco de Dados & Migrations</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> RPCs & Funções PostgreSQL</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Políticas RLS & RBAC</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Performance & Consultas N+1</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold uppercase tracking-tight">Validação de KPIs</h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Todos os indicadores devem ser comparados com consultas SQL diretas. Proibido o uso de mocks ou fallbacks simulados.
            </p>
            <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>KPI Dashboard</span>
                <span>VS</span>
                <span>Consulta SQL</span>
              </div>
              <div className="h-1 w-full bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[100%]" />
              </div>
            </div>
          </div>
        </section>

        {/* MODULOS CRÍTICOS */}
        <section className="space-y-8">
           <h2 className="text-2xl font-black uppercase tracking-tighter border-l-4 border-blue-500 pl-4">Homologação por Contexto</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModuleCard title="Comercial & Reservas" desc="Orçamentos, limites de crédito, bloqueios e reservas físicas vs fiscais." />
              <ModuleCard title="MRP & Engenharia" desc="BOM, estoques de segurança, cálculo de demanda e explosão de materiais." />
              <ModuleCard title="APS & Planejamento" desc="Capacidade, carga, turnos e algoritmo de sequenciamento determinístico." />
              <ModuleCard title="PCP & Produção" desc="OPs, apontamentos, perdas, setups e consumo real de materiais." />
              <ModuleCard title="Estoque & Lotes" desc="Saldos físicos/disponíveis, genealogia de lotes e rastreabilidade de rolos." />
              <ModuleCard title="Qualidade & RNC" desc="Inspeção, bloqueios, liberação comercial e fluxos de retrabalho." />
              <ModuleCard title="Industrialização" desc="Controle de remessa e retorno em terceiros com apuração de custos." />
              <ModuleCard title="Financeiro & DRE" desc="Contas a pagar/receber, fluxo de caixa e integração automática MES." />
              <ModuleCard title="Fiscal & Focus NFe" desc="Regras tributárias, CFOP/CST e prontidão para transmissão real." />
           </div>
        </section>

        {/* TESTES E QUALIDADE */}
        <section className="bg-gradient-to-br from-blue-600/20 to-indigo-900/20 border border-blue-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Testing Agent Obrigatório</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckItem text="Typecheck & Lint" />
                <CheckItem text="Testes Unitários & Integração" />
                <CheckItem text="Testes de Concorrência" />
                <CheckItem text="Smoke Tests & Build Prod" />
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center space-y-4 shadow-2xl">
               <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-2">
                 <Zap className="w-8 h-8 text-blue-400" />
               </div>
               <div className="text-3xl font-black text-white uppercase tracking-tighter italic">Status: Auditando</div>
               <p className="text-[10px] uppercase tracking-widest text-white/40">Garantia de Qualidade Industrial</p>
            </div>
          </div>
        </section>

        {/* CRITÉRIOS DE ACEITE */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-400">Critérios de Aceite</h2>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
              <AcceptanceItem text="Todo o fluxo comercial e de reservas funcionar ponta a ponta." />
              <AcceptanceItem text="MRP e APS validado com algoritmos determinísticos reais." />
              <AcceptanceItem text="Produção e MES com apontamentos integrados ao estoque." />
              <AcceptanceItem text="Rastreabilidade total de lotes e rolos homologada." />
              <AcceptanceItem text="Dashboard Executivo 100% livre de dados mockados." />
              <AcceptanceItem text="RBAC e RLS auditados em todas as rotas e RPCs." />
              <AcceptanceItem text="Build e Bateria de Testes com 100% de aprovação." />
              <AcceptanceItem text="Fiscal pronto para Focus NFe (pendência apenas credenciais)." />
            </div>
          </div>
        </section>

        <footer className="pt-12 border-t border-white/10 text-center pb-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">
            Relatório Final Obrigatório — Engenharia Digitale Têxtil — 2026
          </p>
        </footer>
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

