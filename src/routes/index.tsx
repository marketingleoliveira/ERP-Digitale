import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, Cpu, Database, Wifi, ShieldCheck, Activity, Trash2 } from "lucide-react";

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
        {/* Step 11 Summary Header */}
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-lg mb-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-500 p-2 rounded">
              <ShieldCheck className="w-6 h-6 text-[#0a0f18]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-400 tracking-tighter uppercase leading-none">ETAPA 12 CONCLUÍDA: INTEGRAÇÃO OPERACIONAL ERP</h2>
              <p className="text-[10px] text-emerald-300/70 font-bold uppercase tracking-widest mt-1">Sincronização Ativa entre Chão de Fábrica & Gestão</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-950/40 p-3 rounded border border-emerald-500/20">
              <Activity className="w-4 h-4 text-emerald-400 mb-2" />
              <h4 className="text-[10px] font-black uppercase text-emerald-200">Processamento Transacional</h4>
              <p className="text-[9px] text-emerald-300/60 leading-tight">Garantia de atomicidade para cada evento (Start/Pause/Stop/Prod).</p>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded border border-emerald-500/20">
              <ShieldAlert className="w-4 h-4 text-emerald-400 mb-2" />
              <h4 className="text-[10px] font-black uppercase text-emerald-200">Regras de Negócio</h4>
              <p className="text-[9px] text-emerald-300/60 leading-tight">Validação de status de OP, tolerância de produção e rastreabilidade.</p>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded border border-emerald-500/20">
              <Cpu className="w-4 h-4 text-emerald-400 mb-2" />
              <h4 className="text-[10px] font-black uppercase text-emerald-200">Rastreabilidade Total</h4>
              <p className="text-[9px] text-emerald-300/60 leading-tight">Vínculo direto entre Lote, Operador, Máquina e Evento Original.</p>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <a 
              href="/mes-agent" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-black text-sm transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              <Cpu className="w-5 h-5" /> Acessar MES Agent Terminal (v2.6.0)
            </a>
          </div>
        </div>

        {/* Requirements Text Requested by User */}
        <div className="bg-slate-900/80 border border-slate-700 p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cpu className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 space-y-6 text-slate-300">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Protocolo de Implementação: Resiliência Industrial</h1>
              <p className="text-sm font-bold text-blue-400 uppercase tracking-widest leading-tight">
                Implemente no Digitale MES Agent um mecanismo confiável de funcionamento offline e sincronização.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-black uppercase mb-1">OBJETIVO</h3>
                  <p className="text-emerald-400 font-bold">Nenhum apontamento pode ser perdido quando a internet cair.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-black uppercase">IMPLEMENTAR</h3>
                  <div>
                    <h4 className="font-bold text-slate-100">1. Banco local IndexedDB</h4>
                    <p className="text-slate-400">Criar stores para: agent_config; operator_session; cached_machines; cached_production_orders; pending_events; synchronized_events; sync_logs.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">2. Estrutura do evento local</h4>
                    <p className="text-slate-400">Cada evento deve possuir: event_id UUID; event_type; agent_id; machine_id; occurred_at; payload; sync_status; retry_count; next_retry_at.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">3. Estados de sincronização</h4>
                    <p className="text-slate-400 italic">pending; syncing; synchronized; failed; permanently_rejected.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">4. Fila</h4>
                    <p className="text-slate-400">Eventos enviados na ordem em que aconteceram. Não enviar evento posterior da mesma OP antes do anterior ser confirmado.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">5. Retry</h4>
                    <p className="text-slate-400">Retry automático com backoff progressivo (10s, 30s, 2m, progressivo).</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-100">6. Reconexão</h4>
                    <p className="text-slate-400">Detectar automaticamente; iniciar sincronização; manter interface utilizável; não duplicar eventos.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">7. Falhas</h4>
                    <p className="text-slate-400">Exibir tela de pendências com: evento; motivo; data; ação para tentar novamente ou solicitar correção.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">8. Cache</h4>
                    <p className="text-slate-400">Manter localmente máquinas, OPs, motivos de parada/perda e operador autenticado com data de validade.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">9. Segurança</h4>
                    <p className="text-rose-400 font-bold uppercase">NUNCA ARMAZENAR: service_role, senha do banco ou token administrativo.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">10. Testes</h4>
                    <p className="text-slate-400">Testar uso offline, queda durante envio, reinício do app, duplicação e preservação da ordem.</p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded">
                  <p className="text-[10px] text-blue-200 font-bold italic leading-tight uppercase">
                    Status: Implementação funcional e build entregues. Pronto para homologação em tablets industriais.
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
            <Trash2 className="w-3 h-3" /> Reset Local Agent Data
          </button>
        </div>
      </div>
    </div>
  );
}
