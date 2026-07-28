import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";

import { redirect } from "@tanstack/react-router";

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
      </div>
    </div>
  );
}
