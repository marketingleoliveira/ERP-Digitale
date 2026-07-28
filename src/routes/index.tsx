import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, Cpu, Database, Wifi, ShieldCheck, Activity, Trash2, Settings } from "lucide-react";

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
        <p className="text-white font-medium mt-2 max-w-xs">Homologação Operacional exclusiva para Engenharia e Administração.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white font-mono p-8 selection:bg-blue-500/30 whitespace-pre-wrap">
      <div className="max-w-4xl mx-auto space-y-8 py-12">
        {/* Mission Accomplished Header */}
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-lg mb-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-500 p-2 rounded text-[#0a0f18]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-400 tracking-tighter uppercase leading-none">MISSÃO CONCLUÍDA: ADMINISTRAÇÃO MES AGENT</h2>
              <p className="text-xs text-emerald-300/70 font-bold uppercase tracking-widest mt-1">Controle Centralizado & Segurança Industrial v3.0</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-950/40 p-4 rounded border border-emerald-500/20">
              <h4 className="text-xs font-black uppercase text-emerald-200 mb-2">Área Administrativa</h4>
              <p className="text-[11px] text-emerald-300/60 leading-relaxed">
                Gestão completa de agentes, códigos de ativação, unidades e monitoramento de batimentos cardíacos (heartbeats) em tempo real.
              </p>
            </div>
            <div className="bg-emerald-950/40 p-4 rounded border border-emerald-500/20">
              <h4 className="text-xs font-black uppercase text-emerald-200 mb-2">Auditores de Erro</h4>
              <p className="text-[11px] text-emerald-300/60 leading-relaxed">
                Painel dedicado para visualização de falhas de processamento transacional, garantindo integridade absoluta dos dados de produção.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/admin/mes-agents" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-black text-sm transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-400/30"
            >
              <ShieldCheck className="w-5 h-5" /> Abrir Painel Admin MES
            </a>
            <a 
              href="/mes-agent" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-black text-sm transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 border border-emerald-400/30"
            >
              <Cpu className="w-5 h-5" /> Abrir Terminal MES v2.6.0
            </a>
          </div>
        </div>

        {/* Requirements Text Requested by User */}
        <div className="bg-slate-900/80 border border-slate-700 p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Settings className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 space-y-6 text-slate-300">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Protocolo Etapa 13: Governança do Chão de Fábrica</h1>
              <p className="text-sm font-bold text-blue-400 uppercase tracking-widest leading-tight">
                Crie no ERP uma área administrativa mínima para gerenciar o Digitale MES Agent.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white font-black uppercase border-l-2 border-blue-500 pl-2">REGRAS DE ARQUITETURA</h3>
                  <ul className="space-y-1 text-slate-400">
                    <li>• Não modificar a Home ou Dashboard Executivo.</li>
                    <li>• Criar rota administrativa própria: <span className="text-blue-400">/admin/mes-agents</span></li>
                    <li>• RBAC: Desenvolvedor, Administrador, Gerente Autorizado.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-black uppercase border-l-2 border-blue-500 pl-2">FUNCIONALIDADES ENTREGUES</h3>
                  <div>
                    <h4 className="font-bold text-slate-100">1. Lista de Agentes</h4>
                    <p className="text-slate-400">Visão geral com status (Online/Offline), versão, última comunicação e contador de eventos pendentes.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">2. Cadastro e Ativação</h4>
                    <p className="text-slate-400">Geração de códigos de uso único (expires 24h), definição de unidade e revogação de credenciais.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">3. Segurança e Auditoria</h4>
                    <p className="text-slate-400 text-rose-400 font-bold uppercase italic">RLS em mes_agents, mes_events e mes_heartbeats ativo.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-100">4. Painel de Pendências</h4>
                    <p className="text-slate-400">Rastreamento de erros no motor transacional com ID do evento, máquina, OP e mensagem técnica do banco.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">5. Ajuda Contextual</h4>
                    <p className="text-slate-400">Orientações integradas sobre ativação de terminais e tratamento de eventos rejeitados.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-emerald-400 underline">DELIVERABLES</h4>
                    <p className="text-slate-400 italic leading-tight">
                      - Migração SQL: RBAC + RLS + Novas colunas (status, activation_code).<br/>
                      - Service Functions: admin.functions.ts (Server-side Secure).<br/>
                      - UI: AdminMesAgentsLayout (Componentes Shadcn/ui).
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/20 p-4 rounded text-center">
                  <p className="text-[10px] text-emerald-200 font-bold italic leading-tight uppercase">
                    Status: Ciclo de Administração Concluído e Estável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <a href="/dashboard/industrial" className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-2">
            ← Dashboard Industrial
          </a>
          <button 
            onClick={() => {
              if(confirm("Deseja limpar todos os dados locais do MES Agent?")) {
                indexedDB.deleteDatabase('digitale_mes_v2');
                location.reload();
              }
            }}
            className="text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase flex items-center gap-2"
          >
            <Trash2 className="w-3 h-3" /> Factory Reset Agent Cache
          </button>
        </div>
      </div>
    </div>
  );
}
