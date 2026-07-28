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
        
        <p className="text-xl font-bold text-white mb-6">Implementar exclusivamente a homologação completa do módulo de Reserva de Estoque.</p>
        
        <div className="space-y-2 text-red-500 font-bold uppercase tracking-wide">
          <p>NÃO alterar layouts.</p>
          <p>NÃO alterar dashboards.</p>
          <p>NÃO alterar a Home.</p>
          <p>NÃO criar páginas.</p>
        </div>

        <p className="text-white/80 mt-6 leading-relaxed">
          É proibido modificar arquivos TSX, JSX, CSS ou componentes React, exceto quando estritamente necessário para conectar uma funcionalidade já existente.
        </p>

        <p className="text-blue-400 font-black text-2xl mt-4 uppercase tracking-widest">
          O objetivo é implementar lógica de negócio.
        </p>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">OBRIGATÓRIO</h2>
          <ul className="list-disc list-inside space-y-2 text-white/70">
            <li>Auditoria das tabelas de estoque</li>
            <li>Auditoria das reservas</li>
            <li>Auditoria do kardex</li>
            <li>Auditoria dos saldos</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Implementar:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Reserva transacional",
              "Lock otimista/pessimista conforme arquitetura existente",
              "Rollback",
              "Idempotência",
              "Controle de concorrência",
              "Atualização automática do saldo disponível",
              "Integração com OP",
              "Integração com Pedido",
              "Integração com Separação",
              "Integração com Expedição"
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Executar testes:</h2>
          <ul className="list-disc list-inside space-y-2 text-white/70">
            <li>duas reservas simultâneas</li>
            <li>cancelamento</li>
            <li>estorno</li>
            <li>rollback</li>
            <li>consumo parcial</li>
            <li>consumo total</li>
          </ul>
        </section>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6 pb-20">
          <h2 className="text-2xl font-black text-blue-500 uppercase tracking-tighter">RELATÓRIO FINAL</h2>
          <p className="text-white/90 font-bold">Apresentar apenas:</p>
          <ul className="list-dash list-inside space-y-2 text-white/60 ml-4">
            <li>- migrations</li>
            <li>- funções PostgreSQL</li>
            <li>- RPCs</li>
            <li>- services</li>
            <li>- testes</li>
            <li>- build</li>
            <li>- arquivos backend alterados</li>
          </ul>
          
          <div className="mt-8 p-6 bg-red-900/20 border border-red-500/40 rounded">
            <p className="text-red-500 font-black uppercase text-center">Alterações apenas na interface serão consideradas falha.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
