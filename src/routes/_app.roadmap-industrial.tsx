import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { 
  Loader2, 
  ShieldAlert, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  BarChart3, 
  AlertCircle,
  FileText,
  Search,
  Database,
  Layout,
  Lock
} from "lucide-react";

export const Route = createFileRoute('/_app/roadmap-industrial')({
  component: RoadmapIndustrialPage,
});

function RoadmapIndustrialPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  
  const isAuthorized = roles.some(r => ["desenvolvedor", "gerente", "admin"].includes(r));

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#1a2333]">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
        <p className="text-white/60 mt-2">Você não possui permissão para visualizar esta documentação técnica.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a2333] text-white p-8 font-sans scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight uppercase text-blue-400">Roadmap de Evolução Industrial</h1>
            <p className="text-xl text-white/60 leading-relaxed font-light">ERP Digitale Têxtil — Planejamento de Sprints & Arquitetura</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Fase 3: Em Execução</span>
          </div>
        </header>

        {/* MISSÃO PRINCIPAL */}
        <section className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-blue-400">Missão Principal — Conclusão ERP</h2>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-8 backdrop-blur-sm">
            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-lg text-white/80 leading-relaxed italic border-l-4 border-blue-500/50 pl-6">
                "Transforme o ERP existente da Digitale Têxtil em um sistema industrial plenamente funcional, integrado, seguro e pronto para operação real."
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="space-y-4">
                  <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <Search className="w-4 h-4" /> Protocolo de Auditoria
                  </h3>
                  <ul className="space-y-2 text-sm text-white/70 list-none pl-0">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Auditoria completa de código e rotas</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Revisão de Banco, RPCs e Triggers</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Auditoria de RLS e RBAC</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Identificação de dados mockados</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-4 h-4" /> Fluxo Industrial Completo
                  </h3>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10 overflow-hidden">
                    <div className="text-[10px] font-mono text-white/40 space-y-1">
                      <div>Pedido → Reserva → MRP</div>
                      <div>→ Planejamento → OP → Separação</div>
                      <div>→ Apontamento → Consumo → Qualidade</div>
                      <div>→ Entrada PA → Expedição → Fiscal</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PARTE 1 — CORREÇÃO DA ARQUITETURA DE NAVEGAÇÃO */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-blue-400">Arquitetura de Navegação</h2>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dashboard Executivo Industrial</h3>
                <p className="text-sm text-white/60">A rota principal (/) deve ser exclusivamente o Dashboard Operacional com dados reais e indicadores de faturamento, OPs, produção e alertas críticos.</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Segregação de Contexto</h3>
                <div className="bg-black/20 p-4 rounded border border-white/5">
                  <div className="text-[10px] font-mono text-blue-400">
                    /admin/roadmap-industrial<br/>
                    /admin/releases<br/>
                    /admin/auditoria<br/>
                    /admin/sprints
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* APS & MOTOR PCP */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-blue-400">APS & Motor de Planejamento</h2>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-8">
             <div className="prose prose-invert max-w-none">
                <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] mb-4">Sprint 3.1 — Calendários e Turnos</h3>
                <p className="text-sm text-white/70">Implementação da infraestrutura temporal: Calendário Industrial por unidade, gestão de feriados, férias e escalas de turnos com atravessamento de meia-noite.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                   <h4 className="text-xs font-bold text-white uppercase mb-2">Capacidade & Carga</h4>
                   <p className="text-[10px] text-white/50">Cálculo de capacidade nominal vs efetiva e ocupação de carga por máquina e centro de trabalho.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                   <h4 className="text-xs font-bold text-white uppercase mb-2">Simulação de Cenários</h4>
                   <p className="text-[10px] text-white/50">Cenários independentes para impacto de urgências ou quebras de máquinas sem afetar o plano oficial.</p>
                </div>
             </div>
          </div>
        </section>

        {/* SEGURANÇA & RBAC */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-blue-400">Segurança & RLS</h2>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm text-white/70 list-none pl-0">
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> RLS em 100% das tabelas sensíveis</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Criptografia AES-256-GCM para certificados</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Auditoria transacional de operações críticas</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> RBAC validado por Server Functions</li>
             </ul>
          </div>
        </section>

        {/* Status Geral */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Status Geral do Projeto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhaseStatus phase="Fase 1: Modelo Industrial" status="Concluída" progress={100} />
            <PhaseStatus phase="Sprint 2: Eng. de Produto" status="Concluída" progress={100} />
            <PhaseStatus phase="Sprint 2.5: Consolidação" status="Concluída" progress={100} />
            <PhaseStatus phase="Fase 3: APS (PCP Avançado)" status="Em Execução" progress={15} />
          </div>
        </section>

        <footer className="pt-12 border-t border-white/10 text-center text-white/30 text-[10px] uppercase tracking-[0.2em] pb-12">
          Uso Exclusivo: Administração & Engenharia de Software — 2026
        </footer>
      </div>
    </div>
  );
}

function PhaseStatus({ phase, status, progress }: { phase: string; status: string; progress: number }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 group hover:border-blue-500/30 transition-all">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-blue-300 group-hover:text-blue-200 transition-colors">{phase}</span>
        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">{status}</span>
      </div>
      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
