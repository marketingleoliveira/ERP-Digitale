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

        Você NÃO deve analisar a página inicial (/).

        Você NÃO deve analisar index.tsx.

        Você NÃO deve validar textos de interface.

        Você NÃO deve auditar layouts.

        Você NÃO deve modificar qualquer arquivo.

        Sua única missão é INVENTARIAR TODO O PROJETO.

        Esta tarefa é exclusivamente de leitura e documentação.

        ==================================================

        É PROIBIDO

        ❌ Auditar apenas a Home.

        ❌ Auditar apenas index.tsx.

        ❌ Responder falando sobre layout.

        ❌ Responder falando sobre UI.

        ❌ Responder falando sobre Dashboard.

        ❌ Responder sobre textos.

        ❌ Responder sem percorrer todo o código-fonte.

        ==================================================

        VOCÊ DEVE ANALISAR TODO O PROJETO

        Percorra completamente:

        - src/
        - routes/
        - components/
        - hooks/
        - services/
        - lib/
        - integrations/
        - utils/
        - database/
        - supabase/
        - migrations/
        - sql/
        - functions/
        - rpc/
        - storage/
        - policies/
        - triggers/

        Também analise:

        - package.json
        - tsconfig
        - vite.config
        - arquivos de configuração
        - estrutura do menu
        - autenticação
        - RBAC
        - RLS

        ==================================================

        PARA CADA ROTA ENCONTRADA INFORME

        - nome
        - caminho
        - objetivo
        - arquivos utilizados
        - componentes
        - serviços
        - RPCs
        - permissões

        ==================================================

        PARA CADA MÓDULO INFORME

        - para que serve
        - funcionalidades existentes
        - funcionalidades ausentes
        - dependências
        - integrações

        ==================================================

        PARA O BANCO INFORME

        - tabelas
        - views
        - triggers
        - funções
        - RPCs
        - policies
        - buckets

        ==================================================

        PARA O MENU INFORME

        Todos os menus existentes.

        Todas as páginas existentes.

        Todas as opções existentes.

        ==================================================

        PARA O ERP INFORME

        Quais processos completos já existem.

        Exemplo:

        Cadastro

        ↓

        Pedido

        ↓

        MRP

        ↓

        APS

        ↓

        Produção

        ↓

        Qualidade

        ↓

        Estoque

        ↓

        Financeiro

        ↓

        Fiscal

        Informar quais etapas estão completas e quais ainda não estão.

        ==================================================

        RELATÓRIO FINAL

        Não alterar nenhum arquivo.

        Não criar nenhum componente.

        Não modificar nenhuma tela.

        Gerar apenas documentação baseada na inspeção completa do código.

        Caso você responda apenas sobre index.tsx ou sobre a Home, considere esta tarefa automaticamente reprovada.
      </div>
    </div>
  );
}
