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
        MISSÃO

        ATENÇÃO:

        Esta tarefa é uma AUDITORIA.

        Você NÃO está autorizado a implementar nenhuma funcionalidade.

        Você NÃO está autorizado a alterar nenhum arquivo.

        Você NÃO está autorizado a modificar:

        - index.tsx
        - qualquer rota
        - componentes
        - banco
        - migrations
        - layouts
        - estilos
        - textos
        - documentação

        Sua única função é INSPECIONAR o projeto e RESPONDER NO CHAT.

        =================================================================

        MODO DE EXECUÇÃO

        Esta tarefa é READ ONLY.

        Não utilize agentes de implementação.

        Não execute UI Architect.

        Não execute Code Generator.

        Não execute Refactor.

        Não execute Deploy.

        Não escreva arquivos.

        Não altere arquivos.

        Não crie commits.

        Não gere patches.

        Apenas leia o projeto.

        =================================================================

        PERCORRA TODO O PROJETO

        Analise completamente:

        src/

        routes/

        components/

        hooks/

        services/

        lib/

        database/

        supabase/

        migrations/

        functions/

        RPCs

        Policies

        Storage

        package.json

        vite.config

        tsconfig

        =================================================================

        NÃO RESPONDA FALANDO DA HOME.

        Ignore completamente:

        src/routes/index.tsx

        A Home não faz parte desta auditoria.

        =================================================================

        RESPONDA NO CHAT

        Não escreva arquivos.

        Não atualize páginas.

        Não altere componentes.

        Sua resposta deve ser apenas texto.

        =================================================================

        RELATÓRIO

        1. Arquitetura

        2. Todos os módulos

        3. Todas as rotas

        4. Todos os menus

        5. Todos os cadastros

        6. Todos os processos

        7. Todas as tabelas

        8. Todas as RPCs

        9. Todas as funções PostgreSQL

        10. Todas as Policies RLS

        11. Todos os papéis RBAC

        12. Todas as integrações

        13. Fluxo operacional completo

        14. Funcionalidades prontas

        15. Funcionalidades parciais

        16. Funcionalidades ausentes

        17. Riscos encontrados

        18. Sugestões de melhoria

        =================================================================

        IMPORTANTE

        Se você modificar qualquer arquivo do projeto, a tarefa será considerada FALHA.

        A resposta deve existir exclusivamente no chat.

        Não gerar código.

        Não gerar patches.

        Não modificar index.tsx.

        Não alterar o projeto.

        Apenas responder com o inventário técnico completo do sistema.
      </div>
    </div>
  );
}
