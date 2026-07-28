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

        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">Software MES Industrial</h2>
          <p className="text-white/90 leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-500/5">
            "as máquinas, do chão de fábrica, tem uma espécie de software nelas, que funciona 24h e offline também, que manda os registros para o sistema ERP, também emitem etiquetas etc, execute essa função aqui no ERP, fornecendo esse possível sofftware que deverá ser instalado nas maquinas."
          </p>
          <div className="mt-6">
            <a 
              href="/pcp/mes-software" 
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded font-bold transition-all"
            >
              Acessar Módulo e Download do Software
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
