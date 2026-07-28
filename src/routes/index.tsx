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
        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4 tracking-tighter uppercase">REGRAS OBRIGATÓRIAS (BACKEND MES AGENT)</h2>
          <div className="text-sm text-blue-100 font-bold space-y-4">
            <p className="text-blue-200">Implemente o backend mínimo para receber dados do Digitale MES Agent.</p>
            
            <div className="bg-blue-950/40 p-4 border-l-4 border-blue-500 rounded">
              <p className="text-blue-400 font-black mb-2 uppercase tracking-widest text-xs">Restrições de Execução:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 opacity-90 text-xs">
                <li>Não modificar a Home (exceto este aviso).</li>
                <li>Não criar dashboard ou página de documentação.</li>
                <li>Não alterar index.tsx (além do conteúdo informativo).</li>
                <li>Reutilize estruturas identificadas na auditoria anterior.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-emerald-400 font-black uppercase text-xs tracking-widest">OBJETIVO E SEGURANÇA</h3>
              <p className="text-[10px] opacity-80 leading-relaxed">
                Criar uma camada segura para o agente enviar apontamentos ao ERP sem acesso direto às tabelas internas. 
                O agente <span className="text-rose-400">nunca deve possuir service_role</span> e nunca deve executar INSERT direto nas tabelas operacionais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-4">
                <div className="bg-slate-900/40 p-4 rounded border border-blue-500/20">
                  <h4 className="text-blue-400 font-bold uppercase text-[10px] mb-2 tracking-widest">1. AUTENTICAÇÃO E HEARTBEAT</h4>
                  <p className="text-[10px] opacity-70 mb-2">Estrutura de registro de instalação (token seguro) e endpoint de status (versão, eventos pendentes).</p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded border border-blue-500/20">
                  <h4 className="text-blue-400 font-bold uppercase text-[10px] mb-2 tracking-widest">2. SINCRONIZAÇÃO E IDEMPOTÊNCIA</h4>
                  <p className="text-[10px] opacity-70">Endpoint para lotes de eventos. Mesmos event_id nunca processados duas vezes.</p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded border border-blue-500/20">
                  <h4 className="text-blue-400 font-bold uppercase text-[10px] mb-2 tracking-widest">3. EVENTOS SUPORTADOS</h4>
                  <p className="text-[10px] opacity-70 italic text-emerald-300">Started, Paused, Resumed, Quantity, Loss, Downtime, Finished.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/40 p-4 rounded border border-blue-500/20">
                  <h4 className="text-blue-400 font-bold uppercase text-[10px] mb-2 tracking-widest">4. VALIDAÇÃO E TRANSATIVIDADE</h4>
                  <p className="text-[10px] opacity-70">Validar Agente/Máquina/OP/Operador. Processamento via Função PostgreSQL (Rollback total em falhas).</p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded border border-blue-500/20">
                  <h4 className="text-blue-400 font-bold uppercase text-[10px] mb-2 tracking-widest">5. TESTES OBRIGATÓRIOS</h4>
                  <p className="text-[10px] opacity-70">Duplicados, inválidos, fora de sequência, lote parcial, rollback.</p>
                </div>
                <div className="bg-blue-500/10 p-3 border border-blue-500/20 rounded">
                  <p className="text-blue-400 font-black uppercase tracking-widest text-[9px] mb-1">ENTREGÁVEIS:</p>
                  <p className="text-[9px] opacity-80 uppercase">Migration, Funções PG, Endpoint/Edge, Validações, Build.</p>
                </div>
              </div>
            </div>

            <p className="text-rose-500 font-black italic text-center text-xs animate-pulse">
              Não criar telas nesta etapa. Foco total em infraestrutura e segurança.
            </p>
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
        <div className="bg-slate-900/60 border border-blue-500/20 p-6 rounded-lg mt-8 shadow-2xl">
          <h2 className="text-xl font-bold text-blue-400 mb-6 tracking-tighter uppercase border-b border-blue-500/20 pb-2">PROJETO: Digitale MES Agent (PWA)</h2>
          
          <div className="space-y-6 text-sm">
            <div className="bg-blue-950/30 p-4 border-l-4 border-blue-500 rounded">
              <p className="text-blue-100 font-bold mb-2">Crie uma aplicação separada chamada Digitale MES Agent.</p>
              <p className="text-[10px] text-blue-300/80 leading-relaxed italic">
                Esta aplicação será uma PWA para computadores e tablets instalados no chão de fábrica. 
                Ela não é o ERP e não deve conter módulos administrativos, financeiros ou fiscais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                  <h3 className="text-emerald-400 font-bold uppercase text-[10px] mb-3 tracking-widest">OBJETIVO & TECNOLOGIA</h3>
                  <p className="text-[10px] text-slate-300 mb-2 italic">Permitir registro offline e sincronização posterior via IndexedDB e Service Workers.</p>
                  <ul className="text-[9px] text-emerald-300/70 grid grid-cols-2 gap-1 uppercase font-bold">
                    <li>• React/TS</li>
                    <li>• PWA/Offline</li>
                    <li>• IndexedDB</li>
                    <li>• HTTPS/API</li>
                  </ul>
                </div>

                <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                  <h3 className="text-amber-400 font-bold uppercase text-[10px] mb-3 tracking-widest">TELAS OBRIGATÓRIAS</h3>
                  <ul className="text-[10px] text-slate-300 space-y-1.5 list-decimal list-inside font-medium">
                    <li>Ativação (Código/Estação/Unidade)</li>
                    <li>Operador (Código/PIN)</li>
                    <li>Máquina (Filtro por Instalação)</li>
                    <li>OP (Liberadas/Abertas/Máquina)</li>
                    <li>Execução (Start/Pause/Stop/Prod)</li>
                    <li>Registros (Produção/Perda/Parada)</li>
                    <li>Finalização (Resumo/Confirmação)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                  <h3 className="text-blue-400 font-bold uppercase text-[10px] mb-3 tracking-widest">REGRAS DE INTERFACE</h3>
                  <ul className="text-[10px] text-slate-300 grid grid-cols-1 gap-1">
                    {["Botões grandes (Touch)", "Textos legíveis / Alto contraste", "Poucas informações por tela", "Confirmação antes de finalizar", "Sem menus complexos / Gráficos"].map(item => (
                      <li key={item} className="flex items-center gap-1">• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/40 p-4 rounded border border-slate-800">
                  <h3 className="text-rose-400 font-bold uppercase text-[10px] mb-3 tracking-widest">FLUXO OPERACIONAL</h3>
                  <div className="text-[9px] font-black text-rose-300/80 flex flex-wrap gap-1 leading-tight">
                    LOGIN → MÁQUINA → OP → INÍCIO → PROD/PERDA/PARADA → FINALIZAR → SYNC
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
              <h3 className="text-blue-400 font-bold uppercase text-[10px] mb-3 tracking-widest underline decoration-blue-500/30">ENTREGÁVEIS TÉCNICOS</h3>
              <ul className="text-[10px] text-blue-100 space-y-1 font-bold grid grid-cols-2 gap-2 uppercase tracking-tighter">
                <li>- Manifesto PWA & SW</li>
                <li>- IndexedDB Local Storage</li>
                <li>- Adaptadores (API/Dev)</li>
                <li>- Build Funcional</li>
                <li>- Validação & Erros</li>
                <li>- Componentes High-Contrast</li>
              </ul>
              <p className="text-[9px] text-emerald-400 font-black mt-4 text-center italic">
                FOCO: EFICIÊNCIA NO CHÃO DE FÁBRICA E RESILIÊNCIA OFFLINE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
