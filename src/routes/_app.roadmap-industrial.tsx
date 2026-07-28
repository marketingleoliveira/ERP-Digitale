import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute('/_app/roadmap-industrial')({
  component: RoadmapIndustrialPage,
});

function RoadmapIndustrialPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  
  const isAuthorized = roles.some(r => ["desenvolvedor", "gerente"].includes(r));

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground mt-2">Você não possui permissão para visualizar esta documentação técnica.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a2333] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-white/10 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-6 uppercase">Roadmap de Evolução Industrial — ERP Digitale Têxtil</h1>
          <p className="text-lg text-white/80 leading-relaxed">Documentação Técnica e Plano de Evolução Estratégica</p>
        </header>

        {/* Sprint 3 — APS Foundation */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">SPRINT 3 — APS FOUNDATION (ADVANCED PLANNING & SCHEDULING)</h2>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
             <div className="prose prose-invert max-w-none text-sm text-white/80">
                <p className="font-bold text-blue-300">MISSÃO</p>
                <p>Iniciar a implementação do APS do ERP Digitale Têxtil construindo a infraestrutura necessária para o planejamento avançado.</p>
                
                <p className="font-bold text-blue-300 mt-4">OBJETIVOS PRINCIPAIS</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>CALENDÁRIO:</strong> Controle de dias úteis, feriados e paradas programadas por unidade.</li>
                  <li><strong>TURNOS:</strong> Gestão completa de jornadas, intervalos e equipes padrão.</li>
                  <li><strong>CAPACIDADE:</strong> Cálculo automático de carga/capacidade por máquina e centro de trabalho.</li>
                  <li><strong>PROGRAMAÇÃO:</strong> Motor de cálculo de carga baseada em roteiro e simulação de cenários.</li>
                  <li><strong>GARGALOS:</strong> Identificação visual de sobrecargas e recursos ociosos.</li>
                </ul>
                
                <p className="mt-4 text-[10px] uppercase text-yellow-500 font-bold">⚠️ Esta sprint foca em infraestrutura e cálculo, não em sequenciamento automático.</p>
             </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Status das Fases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhaseStatus phase="Fase 1: Modelo Industrial" status="Concluída" progress={100} />
            <PhaseStatus phase="Sprint 2: Eng. de Produto" status="Concluída" progress={100} />
            <PhaseStatus phase="Sprint 2.5: Consolidação" status="Concluída" progress={100} />
            <PhaseStatus phase="Fase 3: APS (PCP Avançado)" status="Em Execução" progress={10} />
          </div>
        </section>

        <footer className="pt-12 border-t border-white/10 text-center text-white/30 text-[10px] uppercase tracking-[0.2em]">
          Uso Exclusivo: Administração & Engenharia de Software — 2026
        </footer>
      </div>
    </div>
  );
}

function PhaseStatus({ phase, status, progress }: { phase: string; status: string; progress: number }) {
  return (
    <div className="p-4 bg-white/5 rounded border border-white/10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-blue-300">{phase}</span>
        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-200">{status}</span>
      </div>
      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
        <div className="bg-blue-500 h-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
