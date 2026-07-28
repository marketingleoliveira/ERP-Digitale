import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";

import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/industrial" });
  },
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
        <h1 className="text-4xl font-black text-blue-500 tracking-tighter uppercase mb-8">ERPADM — LIMPEZA ESTRUTURAL</h1>
        
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest">DESTAQUE VISUAL: EXPLICAÇÃO DO MENU</h2>
            <p className="text-white/80 leading-relaxed">
              O botão de assistência foi renomeado para "Explicação do Menu" e recebeu um tratamento visual de alta visibilidade: cor vermelha (destructive), animação pulsante constante e bordas destacadas. Este padrão foi aplicado globalmente para garantir que o usuário identifique imediatamente onde obter auxílio operacional sobre a tela atual.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">EVIDÊNCIA TÉCNICA</h2>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-lg space-y-4">
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li><span className="text-blue-400 font-bold">SIDEBAR:</span> Exclusão completa do componente `CircleHelp` nos botões de menu</li>
                <li><span className="text-blue-400 font-bold">TOPBAR:</span> Manutenção do acesso centralizado à documentação</li>
                <li><span className="text-blue-400 font-bold">UX:</span> Redução de ruído visual e simplificação da hierarquia de ações</li>
              </ul>
            </div>
          </section>
        </div>

        <hr className="border-white/10 my-16" />

        <footer className="text-center pb-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 italic">
            Engenharia Industrial Digitale Têxtil — Minimalismo e Foco Operacional
          </p>
        </footer>
      </div>
    </div>
  );
}
