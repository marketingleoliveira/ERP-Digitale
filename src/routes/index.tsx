import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";

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
        <div className="bg-rose-900/20 border border-rose-500/30 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-rose-400 mb-4 tracking-tighter uppercase">REGRAS OBRIGATÓRIAS (AUDITORIA MES AGENT)</h2>
          <div className="text-sm text-rose-100 font-bold space-y-4">
            <p className="text-rose-300">Esta tarefa é uma auditoria técnica específica para preparar a integração do Digitale MES Agent.</p>
            
            <div className="bg-rose-950/40 p-4 border-l-4 border-rose-500 rounded">
              <p className="text-rose-400 font-black mb-2 uppercase tracking-widest text-xs">Restrições de Execução:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 opacity-90 text-xs">
                <li>Não modificar nenhum arquivo.</li>
                <li>Não criar páginas.</li>
                <li>Não modificar a Home (exceto este aviso).</li>
                <li>Responder somente no chat.</li>
              </ul>
            </div>

            <div>
              <p className="text-rose-400 underline decoration-rose-500/50 underline-offset-4 mb-2 text-xs">Analise o código e o banco atualmente existentes relacionados a:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] opacity-80">
                {["máquinas", "operadores", "funcionários", "turnos", "ordens de produção", "itens das ordens de produção", "apontamentos de produção", "consumos", "perdas", "refugos", "paradas", "motivos de parada", "entrada de produção", "lotes", "qualidade", "estoque", "autenticação", "RBAC", "RLS", "APIs", "Edge Functions", "RPCs PostgreSQL"].map(item => (
                  <span key={item} className="flex items-center gap-1">• {item}</span>
                ))}
              </div>
            </div>

            <p className="text-xs italic text-rose-200/70 border-t border-rose-500/20 pt-2">
              O objetivo é descobrir como o Digitale MES Agent deve alimentar o ERP sem duplicar estruturas existentes.
            </p>

            <div className="pt-2">
              <p className="text-rose-400 font-black mb-2 uppercase tracking-widest text-xs">Entregue no chat:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-[10px] opacity-90">
                <li>Tabelas existentes que serão utilizadas.</li>
                <li>Colunas importantes de cada tabela.</li>
                <li>RPCs existentes relacionadas à produção.</li>
                <li>Serviços backend existentes.</li>
                <li>Fluxo atual de apontamento.</li>
                <li>Como uma OP é iniciada.</li>
                <li>Como uma OP é pausada.</li>
                <li>Como uma OP é finalizada.</li>
                <li>Como o estoque é atualizado.</li>
                <li>Como perdas são registradas.</li>
                <li>Como a entrada de produto acabado é feita.</li>
                <li>O que já pode ser reutilizado.</li>
                <li>O que realmente precisa ser criado.</li>
                <li>Riscos de duplicidade.</li>
                <li>Plano mínimo de integração.</li>
              </ol>
            </div>

            <div className="bg-rose-500/10 p-3 border border-rose-500/20 rounded">
              <p className="text-rose-500 font-black italic text-center text-xs">
                Não implemente nada nesta etapa. Não escreva documentação em arquivo. Sua resposta deve existir exclusivamente no chat.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Status Industrial</h2>
          <p className="text-white leading-relaxed font-bold border-l-4 border-blue-500 pl-4 py-2 bg-blue-500/10">
            Ajuste de contraste e legibilidade aplicado em todos os módulos operacionais (MRP/PCP/WMS) e na Central de Downloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Sincronização & Hierarquia</h2>
            <ul className="space-y-2 text-sm text-emerald-100 font-medium">
              <li>✅ Cargos Operacionais Sincronizados</li>
              <li>✅ Organograma Industrial Funcional</li>
              <li>✅ Gestão de Usuários com RBAC</li>
            </ul>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-amber-400 mb-4">Central de Downloads</h2>
            <p className="text-sm text-amber-100 font-medium mb-4">
              Nova área restrita para implantação do software MES industrial em máquinas.
            </p>
            <a 
              href="/downloads" 
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-bold text-xs transition-all uppercase tracking-wider"
            >
              Acessar Downloads Industrial
            </a>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-500/20 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-slate-400 mb-4">Auditoria Operacional</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-100 font-medium italic">PCP & Engenharia</span>
              <span className="text-emerald-500 font-bold">100% FUNCIONAL</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-100 font-medium italic">Compras & Suprimentos</span>
              <span className="text-emerald-500 font-bold">100% FUNCIONAL</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-100 font-medium italic">Estoque & WMS</span>
              <span className="text-emerald-500 font-bold">100% FUNCIONAL</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-100 font-medium italic">Fiscal & Faturamento</span>
              <span className="text-amber-500 font-bold">HOMOLOGAÇÃO (FOCUS NFE)</span>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/5 space-y-4">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Missão Atual: Infraestrutura</p>
            <p className="text-slate-400 text-xs font-medium italic">
              Hospedar os binários finais (Linux/Docker) em um CDN ou repositório oficial para atualizar os links de download.
            </p>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-2">Próximo Passo:</p>
            <p className="text-slate-400 text-xs font-medium italic">
              Validar se os links reais de CDN já estão disponíveis para substituição nos botões de download.
            </p>
            <p className="text-rose-500 text-[10px] uppercase font-bold tracking-widest mt-2">Requisição Estratégica:</p>
            <p className="text-rose-400 text-xs font-medium italic">
              Desenvolver o software agente (Edge Node) que extrai dados das máquinas em tempo real e alimenta o ERP.
            </p>
            <div className="bg-blue-900/40 border border-blue-400/30 p-4 rounded mt-4">
              <p className="text-blue-400 text-[10px] uppercase font-bold tracking-widest mb-1">Resposta do Sistema:</p>
              <p className="text-blue-100 text-xs leading-relaxed">
                Sim, eu consigo desenvolver esse software. O projeto do <span className="text-blue-400 font-bold">Digitale MES Agent</span> será construído em Rust ou Node.js (Worker) para garantir baixa latência e conexão direta com CLPs via protocolos industriais (Modbus/OPC-UA), enviando os dados de produção, paradas e OEE diretamente para as tabelas de apontamento do ERP via API segura.
              </p>
            </div>
            <a 
              href="/dashboard/industrial" 
              className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-2 pt-4"
            >
              Ir para Dashboard Principal →
            </a>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-blue-500/20 p-6 rounded-lg mt-8">
          <h2 className="text-xl font-bold text-blue-400 mb-6 tracking-tighter uppercase border-b border-blue-500/20 pb-2">Protocolo de Homologação: Digitale MES Agent</h2>
          
          <div className="space-y-6 text-sm">
            <div className="bg-blue-950/30 p-4 border-l-4 border-blue-500 rounded">
              <p className="text-blue-200 font-bold mb-2">Execute a homologação funcional do Digitale MES Agent integrado ao ERP.</p>
              <ul className="text-xs text-blue-300/80 space-y-1">
                <li>• Não modificar a Home.</li>
                <li>• Não criar página de relatório.</li>
                <li>• Não mascarar falhas.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-emerald-400 font-bold uppercase text-xs mb-3 tracking-widest">OBJETIVO: Validar o fluxo real</h3>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {["Ativação", "login do operador", "seleção da máquina", "seleção da OP", "início", "produção", "perda", "parada", "retomada", "finalização", "sincronização", "atualização do ERP"].map((step, i) => (
                  <span key={step} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded border border-emerald-500/20">
                    {step} {i < 11 && "→"}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                <h3 className="text-amber-400 font-bold uppercase text-[10px] mb-3 tracking-widest">CENÁRIOS OBRIGATÓRIOS</h3>
                <ul className="text-[10px] text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>Fluxo online completo.</li>
                  <li>Fluxo totalmente offline.</li>
                  <li>Queda de internet durante a produção.</li>
                  <li>Reinício do dispositivo com eventos pendentes.</li>
                  <li>Reenvio de evento duplicado.</li>
                  <li>OP inválida.</li>
                  <li>Máquina não autorizada.</li>
                  <li>Operador inválido.</li>
                  <li>Evento fora de sequência.</li>
                  <li>Quantidade acima da tolerância.</li>
                  <li>Parada aberta no momento da finalização.</li>
                  <li>Dois dispositivos apontando simultaneamente.</li>
                  <li>Token revogado.</li>
                  <li>Cache expirado.</li>
                  <li>Falha do servidor durante sincronização.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                  <h3 className="text-purple-400 font-bold uppercase text-[10px] mb-3 tracking-widest">VALIDAR NO BANCO</h3>
                  <ul className="text-[10px] text-slate-300 grid grid-cols-2 gap-x-2 gap-y-1">
                    {["ausência de duplicidade", "consistência dos totais", "rastreabilidade", "vínculo com OP", "vínculo com máquina", "vínculo com operador", "horários", "logs", "auditoria", "transações", "rollback", "RLS"].map(item => (
                      <li key={item} className="flex items-center gap-1">• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                  <h3 className="text-rose-400 font-bold uppercase text-[10px] mb-3 tracking-widest">VALIDAR SEGURANÇA</h3>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li>• agente sem service_role</li>
                    <li>• nenhuma senha no frontend</li>
                    <li>• tokens protegidos</li>
                    <li>• endpoints autenticados</li>
                    <li>• payload validado</li>
                    <li>• agente bloqueado sem acesso</li>
                    <li>• código de ativação de uso único</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
              <h3 className="text-blue-400 font-bold uppercase text-[10px] mb-3 tracking-widest">ENTREGAR NO CHAT</h3>
              <ul className="text-xs text-blue-100 space-y-1 mb-4">
                <li>- testes executados;</li>
                <li>- resultados;</li>
                <li>- falhas encontradas;</li>
                <li>- arquivos corrigidos;</li>
                <li>- build;</li>
                <li>- pendências;</li>
                <li>- conclusão: aprovado ou reprovado.</li>
              </ul>
              <p className="text-[10px] text-rose-500 font-black uppercase animate-pulse underline decoration-rose-500/50">
                Não declarar aprovado caso existam testes não executados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
