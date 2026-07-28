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
        
        <p className="text-xl font-bold text-white mb-6">Homologar exclusivamente o Motor MRP.</p>
        
        <div className="space-y-2 text-red-500 font-bold uppercase tracking-wide">
          <p>É proibido alterar qualquer componente visual.</p>
          <p>Não modificar Dashboard.</p>
          <p>Não modificar Home.</p>
          <p>Não criar gráficos.</p>
        </div>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Auditar:</h2>
          <ul className="list-disc list-inside space-y-2 text-white/70">
            <li>BOM</li>
            <li>Estoque</li>
            <li>Reservas</li>
            <li>Compras</li>
            <li>Lead Time</li>
            <li>Estoque Segurança</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Implementar:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "cálculo da necessidade líquida",
              "explosão multinível da BOM",
              "materiais substitutos",
              "perdas",
              "estoque reservado",
              "estoque bloqueado",
              "pedidos em aberto",
              "ordens em produção",
              "sugestões de compra"
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 pt-6 text-white/80">
          <p>Comparar todos os resultados com SQL direto.</p>
          <p>Criar testes unitários.</p>
          <p>Criar testes de integração.</p>
          <p>Executar build.</p>
        </section>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6 pb-20 text-center">
          <p className="text-blue-500 font-black text-xl uppercase tracking-widest">Apresentar apenas evidências técnicas.</p>
        </section>
      </div>
    </div>
  );
}
