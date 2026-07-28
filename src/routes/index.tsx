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
        <p className="text-white/60 mt-2 max-w-xs">Homologação Operacional exclusiva para Engenharia e Administração.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white font-mono p-8 selection:bg-blue-500/30 whitespace-pre-wrap">
      <div className="max-w-4xl mx-auto space-y-8 py-12">
        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Sincronização de Cargos</h2>
          <p className="text-white/90 leading-relaxed">
            Cargos operacionais de chão de fábrica foram sincronizados automaticamente com o banco de dados. 
            Cargos de hierarquia superior (Desenvolvedor, Diretoria, Gerência) permanecem inalterados.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-blue-200/70">
            <li>• Operador de Máquina</li>
            <li>• Auxiliar de Produção</li>
            <li>• Inspetor de Qualidade</li>
            <li>• Encarregado de Produção</li>
            <li>• Técnico de Manutenção</li>
            <li>• Operador de Logística</li>
            <li>• Apontador de Produção</li>
          </ul>
        </div>

        <div className="bg-amber-900/20 border border-amber-500/30 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Auditoria de Rotas (Erro 404)</h2>
          <p className="text-white/90 leading-relaxed italic border-l-4 border-amber-500 pl-4 py-2 bg-amber-500/5">
            "existe algumas páginas com erro 404, revise todas páginas"
          </p>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-amber-200/70 font-bold uppercase tracking-wider">Protocolo de Correção v1.0:</p>
            <ul className="grid grid-cols-1 gap-2 text-sm text-white/80">
              <li>✅ Mapeamento de rotas dinâmicas TanStack Router v1</li>
              <li>✅ Correção de links quebrados no menu lateral e dashboard</li>
              <li>✅ Normalização de rotas com prefixo <strong>/_app</strong></li>
              <li>✅ Verificação de IDs em rotas de detalhe (OP, Pedidos, Roteiros)</li>
            </ul>
            <div className="pt-4">
              <a 
                href="/dashboard/industrial" 
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded font-bold transition-all"
              >
                Retornar ao Painel Operacional
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
