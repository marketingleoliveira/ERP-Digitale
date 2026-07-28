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
        
        <div className="space-y-6">
          <p className="text-xl font-bold text-white">Implementar um Sistema Global de Ajuda Contextual para todo o ERP da Digitale Têxtil.</p>
          
          <p className="text-white/80">O objetivo NÃO é apenas adicionar um botão "AJUDA".</p>
          
          <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 space-y-2">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-400">Objetivo Estrutural:</p>
            <p className="text-white/70">Criar uma infraestrutura reutilizável para que qualquer módulo atual ou futuro possua automaticamente:</p>
            <ul className="list-disc list-inside text-white/60 text-sm space-y-1 ml-2">
              <li>descrição resumida</li>
              <li>ajuda detalhada</li>
              <li>documentação contextual</li>
              <li>dicas de utilização</li>
              <li>melhores práticas</li>
              <li>permissões necessárias</li>
              <li>integração com outros módulos</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-red-400">
            <span>Toda a implementação deverá ser reutilizável.</span>
            <span>Não duplicar código.</span>
            <span>Não criar uma solução específica para apenas uma tela.</span>
          </div>
        </div>

        <hr className="border-white/10 my-10" />

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-2">REGRAS IMPORTANTES</h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">!</span>
              <span>É proibido criar uma implementação diferente para cada página.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">→</span>
              <span>Criar apenas um componente global reutilizável.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">→</span>
              <span>Toda página deverá consumir este componente.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">!</span>
              <span>Não copiar texto diretamente dentro das páginas.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">→</span>
              <span>Todas as descrições deverão vir de uma estrutura centralizada.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-2">ARQUITETURA</h2>
          <p className="text-white/60">Criar um sistema composto por:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "HelpSection",
              "HelpDialog",
              "HelpContent",
              "HelpRegistry",
              "HelpProvider",
              "Hook useHelp()"
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-white/5 rounded text-xs font-mono text-white/50">
            <p className="text-blue-400 mb-2">// Exemplo de Identificadores:</p>
            <p>employees.list | customers.list | orders.list | inventory.products | inventory.stock | production.orders | quality.inspections | finance.accounts | fiscal.nfe</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-2">CABEÇALHO E BOTÃO</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-blue-400 font-bold uppercase text-xs tracking-widest">Páginas:</h3>
              <p className="text-sm text-white/70 italic">"Gerencie os colaboradores da empresa, cadastre novos funcionários..."</p>
              <ul className="text-xs text-white/50 space-y-1 list-disc list-inside">
                <li>Aparência discreta</li>
                <li>Fonte menor que o título</li>
                <li>Cor secundária</li>
                <li>Máximo de duas linhas</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-blue-400 font-bold uppercase text-xs tracking-widest">Ajuda:</h3>
              <p className="text-sm text-white/70 flex items-center gap-2">
                <span className="border border-white/20 px-2 py-0.5 rounded text-[10px] uppercase">AJUDA</span>
                <span className="text-white/40">(CircleHelp Lucide)</span>
              </p>
              <ul className="text-xs text-white/50 space-y-1 list-disc list-inside">
                <li>Estilo Outline / Pequeno</li>
                <li>Abre Dialog padronizado</li>
                <li>Nunca abrir nova página ou redirecionar</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-2">HELP REGISTRY & ESCALABILIDADE</h2>
          <div className="p-6 bg-white/5 rounded space-y-4 text-sm">
            <p className="font-bold text-blue-400">helpRegistry.ts</p>
            <p className="text-white/70">Estrutura obrigatória por módulo:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] uppercase font-bold text-white/40">
              <span>id</span>
              <span>title</span>
              <span>summary</span>
              <span>description</span>
              <span>features</span>
              <span>permissions</span>
              <span>integrations</span>
              <span>bestPractices</span>
              <span>tips</span>
              <span>relatedModules</span>
            </div>
            <p className="text-xs italic text-red-400 mt-4">Jamais escrever texto diretamente dentro das páginas.</p>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/10">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Responsividade</h4>
            <p className="text-xs text-white/60">Desktop, Tablet e Mobile automáticos.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Acessibilidade</h4>
            <p className="text-xs text-white/60">ARIA, Focus Trap, ESC/Enter, Tab.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Performance</h4>
            <p className="text-xs text-white/60">Lazy loading sob demanda.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">i18n</h4>
            <p className="text-xs text-white/60">Multi-idioma e sem textos fixos.</p>
          </div>
        </section>

        <section className="space-y-6 pt-10">
          <h2 className="text-2xl font-black text-green-500 uppercase tracking-tighter">CRITÉRIOS DE ACEITE</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-2 text-sm text-white/70">
            {[
              "Descrição abaixo do título em todas as páginas",
              "Botão AJUDA em todas as páginas",
              "Popup contextual padronizado",
              "Conteúdo 100% via Help Registry",
              "Sem textos duplicados",
              "Componente reutilizável e responsivo",
              "Acessibilidade completa",
              "Não alterar Home nem arquitetura existente"
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-green-500 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8 pt-20 pb-20">
          <div className="text-center space-y-4">
            <h3 className="text-blue-500 font-black text-xl uppercase tracking-widest">RELATÓRIO FINAL OBRIGATÓRIO</h3>
            <p className="text-white/40 text-xs italic">A implementação deverá ser estrutural, reutilizável e preparada para todos os módulos.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] font-black uppercase tracking-tighter text-white/60">
            <span>Arquivos criados</span>
            <span>Componentes</span>
            <span>Hooks</span>
            <span>Help Registry</span>
            <span>Páginas integradas</span>
            <span>Testes</span>
            <span>Build</span>
          </div>
        </section>
      </div>
    </div>
  );
}
