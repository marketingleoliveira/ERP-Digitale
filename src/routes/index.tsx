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
        <h1 className="text-4xl font-black text-blue-500 tracking-tighter uppercase mb-8">MISSÃO</h1>
        
        <p className="text-xl font-bold text-white mb-6">Homologar exclusivamente o Financeiro.</p>
        
        <div className="space-y-2 text-red-500 font-bold uppercase tracking-wide">
          <p>Não alterar layouts.</p>
        </div>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Validar:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "contas receber",
              "contas pagar",
              "baixas",
              "estornos",
              "fluxo caixa",
              "DRE",
              "centros custo",
              "integração automática"
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 pt-6 text-white/80 font-bold">
          <p>Executar testes.</p>
        </section>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6 pb-20">
          <h3 className="text-blue-500 font-black text-xl uppercase tracking-widest text-center">Apresentar:</h3>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-white/60 uppercase text-sm font-bold">
            <span>migrations</span>
            <span>services</span>
            <span>RPCs</span>
            <span>build</span>
            <span>testes</span>
            <span>arquivos backend</span>
          </div>
        </section>
      </div>
    </div>
  );

        <hr className="border-white/10 my-10" />

        <section className="space-y-6 pb-20 text-center">
          <p className="text-blue-500 font-black text-xl uppercase tracking-widest">Apresentar apenas alterações técnicas.</p>
        </section>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6 pb-20 text-center">
          <p className="text-blue-500 font-black text-xl uppercase tracking-widest">Apresentar somente evidências técnicas.</p>
        </section>

        <hr className="border-white/10 my-10" />

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-blue-500 uppercase tracking-tighter">Apresentar:</h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-white/70">
            <span>RPCs</span>
            <span>Services</span>
            <span>Migrations</span>
            <span>Testes</span>
            <span>Build</span>
            <span>Arquivos backend</span>
          </div>
        </section>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6 pb-20">
          <h2 className="text-2xl font-black text-red-500 uppercase tracking-tighter">CRITÉRIO DE REPROVAÇÃO AUTOMÁTICA</h2>
          
          <div className="p-6 bg-red-900/20 border border-red-500/40 rounded space-y-4">
            <p className="text-white font-bold">A implementação será considerada REPROVADA caso:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>altere apenas arquivos TSX, JSX, CSS ou componentes visuais;</li>
              <li>crie dashboards, páginas de documentação ou layouts;</li>
              <li>não modifique banco de dados, backend ou testes;</li>
              <li>não apresente evidências técnicas.</li>
            </ul>
            <p className="text-red-400 font-black uppercase text-sm mt-4 italic">Arquivos exclusivamente de interface NÃO contam como implementação.</p>
          </div>

          <div className="mt-10 space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Toda resposta deverá conter obrigatoriamente:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "migrations criadas",
                "funções PostgreSQL",
                "RPCs",
                "services alterados",
                "regras de negócio implementadas",
                "testes executados",
                "resultado do build",
                "lista de arquivos backend modificados"
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-center text-xs mt-12 italic">
            Não serão aceitas respostas contendo apenas "UI Architect executado" ou "Dashboard atualizado".
          </p>
        </section>
      </div>
    </div>
  );
}
