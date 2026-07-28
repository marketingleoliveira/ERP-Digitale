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
        <p className="text-white/60 mt-2 max-w-xs">Homologação Operacional exclusiva para Engenharia e Administração.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white font-mono p-8 selection:bg-blue-500/30 whitespace-pre-wrap">
      <div className="max-w-4xl mx-auto space-y-8 py-12">
        <h1 className="text-4xl font-black text-blue-500 tracking-tighter uppercase mb-8">MISSÃO: SISTEMA DE AJUDA</h1>
        
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">1. HelpRegistry & Centralização</h2>
            <p className="text-white/80 leading-relaxed">
              Crie a estrutura do HelpRegistry com ids (ex: finance.accounts, fiscal.nfe, inventory.stock) e campos summary, description, features, permissions, integrations, bestPractices, tips e relatedModules carregados centralmente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">2. Infraestrutura & Hooks</h2>
            <p className="text-white/80 leading-relaxed">
              Implemente o HelpProvider e o hook useHelp() para resolver o conteúdo pelo identificador da página e fornecer os dados para o componente global de ajuda.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">3. Componentes de Interface</h2>
            <p className="text-white/80 leading-relaxed">
              Desenvolva os componentes HelpSection e HelpDialog com botão AJUDA (CircleHelp) e popup padronizado (Fade + Scale) respeitando responsividade e sem abrir nova página.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">4. Integração Modular</h2>
            <p className="text-white/80 leading-relaxed">
              Integre automaticamente o help contextual nas páginas dos módulos principais, fazendo cada tela consumir o componente global apenas informando o id correto.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">5. Acessibilidade & i18n</h2>
            <p className="text-white/80 leading-relaxed">
              Ative suporte a i18n para todas as descrições e garanta acessibilidade completa com ARIA Labels, Focus Trap, ESC fecha e navegação por Tab, além de testes de usabilidade.
            </p>
          </section>
        </div>

        <hr className="border-white/10 my-16" />

        <footer className="text-center pb-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 italic">
            Engenharia Industrial Digitale Têxtil — Protocolo de Homologação de Ajuda Contextual
          </p>
        </footer>
      </div>
    </div>
  );
}
