import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, ArrowRight, Calendar, Clock, Users, Activity, BarChart3, AlertCircle } from "lucide-react";

export const Route = createFileRoute('/_app/roadmap-industrial')({
  component: RoadmapIndustrialPage,
});

function RoadmapIndustrialPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  
  const isAuthorized = roles.some(r => ["desenvolvedor", "gerente"].includes(r));

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

        {/* Sprint 3.1 — Calendários e Turnos */}
        <section className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-blue-400">Sprint 3.1 — Calendários e Turnos</h2>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-8 backdrop-blur-sm">
            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-lg text-white/80 leading-relaxed italic border-l-4 border-blue-500/50 pl-6">
                "Essa Sprint deverá criar toda a infraestrutura temporal da fábrica. Sem isso o APS nunca será confiável."
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="space-y-4">
                  <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Calendário Industrial
                  </h3>
                  <ul className="space-y-2 text-sm text-white/70 list-none pl-0">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Calendário por unidade</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Gestão de Dias Úteis & Feriados</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Sábados, Domingos & Férias Coletivas</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Manutenção & Eventos Especiais</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Períodos de Capacidade Reduzida</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Gestão de Turnos
                  </h3>
                  <div className="space-y-4">
                    <p className="text-xs text-white/50">Atributos obrigatórios por turno:</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                      <span className="bg-white/10 px-2 py-1 rounded">Nome</span>
                      <span className="bg-white/10 px-2 py-1 rounded">Início</span>
                      <span className="bg-white/10 px-2 py-1 rounded">Término</span>
                      <span className="bg-white/10 px-2 py-1 rounded">Intervalo</span>
                      <span className="bg-white/10 px-2 py-1 rounded">Equipe</span>
                      <span className="bg-white/10 px-2 py-1 rounded">Capacidade</span>
                      <span className="bg-white/10 px-2 py-1 rounded">Dias Válidos</span>
                    </div>
                    <p className="text-xs text-white/50 italic">Suporte a múltiplos turnos e atravessamento de meia-noite.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/5 rounded-xl p-6 border border-blue-500/10 space-y-4">
                <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                  <Users className="w-4 h-4" /> Hierarquia de Vinculação
                </h3>
                <div className="flex items-center justify-between text-xs font-mono text-white/60 overflow-x-auto gap-4 py-2">
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">Equipe</div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">Turno</div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">Centro</div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 font-bold text-white">Máquinas</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Disponibilidade de Ativo
                  </h3>
                  <div className="space-y-2 text-[10px] font-mono text-white/50">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span>Tempo Disponível</span>
                      <span className="text-blue-400">100%</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span>Tempo Reservado</span>
                      <span className="text-yellow-400">Sprint 3.3+</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span>Tempo Parado</span>
                      <span className="text-red-400">MES Integration</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span>Tempo Manutenção</span>
                      <span className="text-orange-400">PCM Module</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Tempo Livre (Disponível)</span>
                      <span className="text-green-400">Calculado</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Agenda das Máquinas
                  </h3>
                  <div className="space-y-3">
                    <p className="text-xs text-white/70">Interface visual padrão "Google Calendar" com visualizações por Dia, Semana e Mês.</p>
                    <div className="flex flex-wrap gap-2">
                      {["OP", "Setup", "Produção", "Manutenção", "Reserva"].map(item => (
                        <span key={item} className="text-[9px] border border-white/20 px-2 py-0.5 rounded text-white/40">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/5 rounded-xl p-6 border border-yellow-500/20 space-y-4 mt-8">
              <h3 className="text-yellow-500 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Fora do Escopo Inicial
              </h3>
              <p className="text-xs text-yellow-500/70 italic">
                Ainda não implementaremos: Drag & Drop, Sequenciamento Automático, IA ou Otimizações. 
                <strong> Primeiro precisamos que o sistema saiba quanto tempo realmente existe disponível.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Linha do Tempo Futura */}
        <section className="space-y-8 pb-16">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-white/40 border-b border-white/10 pb-4">A sequência natural (Pós-3.1)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FutureSprint title="Sprint 3.2 — Cálculo de Capacidade" items={["Carga por máquina/centro/turno", "Horas restantes", "Taxa de Utilização"]} />
            <FutureSprint title="Sprint 3.3 — Programação Manual" items={["Alocação de OPs", "Reagendamento & Priorização", "Resolução de conflitos"]} />
            <FutureSprint title="Sprint 3.4 — Simulação" items={["Cenários 'E se...'", "Quebras e atrasos de fornecedores", "Impacto de horas extras"]} />
            <FutureSprint title="Sprint 3.5 — Sequenciamento APS" items={["Algoritmos de planejamento", "Balanceamento de carga", "Promessa de entrega (ATP/CTP)"]} />
          </div>
        </section>

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

function FutureSprint({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4 hover:bg-white/10 transition-colors cursor-default">
      <h3 className="text-sm font-bold text-blue-300 uppercase tracking-tight">{title}</h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[10px] text-white/50 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-blue-500/50"></span>
            {item}
          </li>
        ))}
      </ul>
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
