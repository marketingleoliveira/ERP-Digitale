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

        NÃO implemente nenhuma funcionalidade.

        NÃO altere nenhum arquivo.

        NÃO modifique banco de dados.

        NÃO execute migrations.

        NÃO altere layouts.

        NÃO altere componentes.

        NÃO corrija bugs.

        NÃO gere código.

        Sua única missão é realizar uma auditoria completa do ERP e gerar uma documentação técnica e funcional extremamente detalhada do estado atual do sistema.

        O objetivo é permitir que outro especialista analise todo o ERP e consiga orientar os usuários sobre como utilizar cada módulo corretamente.

        Não resuma informações.

        Quanto mais detalhes forem apresentados, melhor.

        ══════════════════════════════════════════════

        PARTE 1 — VISÃO GERAL

        Descreva:

        • arquitetura do sistema

        • framework utilizado

        • banco de dados

        • autenticação

        • autorização

        • integrações

        • storage

        • realtime

        • filas

        • jobs

        • APIs

        • organização das pastas

        ══════════════════════════════════════════════

        PARTE 2 — MAPA COMPLETO DO MENU

        Liste absolutamente todos os menus existentes.

        Para cada menu informar:

        Nome

        Rota

        Descrição

        Objetivo

        Quem pode acessar

        Módulos relacionados

        Status

        (Completo / Parcial / Não implementado)

        ══════════════════════════════════════════════

        PARTE 3 — PÁGINAS

        Liste TODAS as páginas existentes.

        Para cada página informar:

        Título

        Arquivo

        Rota

        Descrição

        Objetivo

        Componentes utilizados

        Serviços utilizados

        RPCs utilizadas

        Permissões

        Integrações

        ══════════════════════════════════════════════

        PARTE 4 — CADASTROS

        Listar todos os cadastros existentes.

        Exemplo:

        Clientes

        Funcionários

        Produtos

        Artigos

        Tecidos

        Cores

        Variantes

        Fornecedores

        Máquinas

        Centros de Trabalho

        Lotes

        Rolos

        Turnos

        Usuários

        Permissões

        Naturezas

        CFOP

        etc.

        Para cada cadastro informar:

        Finalidade

        Campos

        Relacionamentos

        Fluxo de utilização

        ══════════════════════════════════════════════

        PARTE 5 — PROCESSOS

        Listar todos os processos implementados.

        Exemplo:

        Pedido

        Reserva

        MRP

        APS

        Produção

        Consumo

        Qualidade

        Expedição

        Industrialização

        Financeiro

        Fiscal

        Para cada processo informar:

        Objetivo

        Etapas

        Entradas

        Saídas

        Integrações

        ══════════════════════════════════════════════

        PARTE 6 — FLUXO OPERACIONAL

        Descrever o fluxo completo do ERP.

        Desde:

        Cadastro do Cliente

        até

        Documento Fiscal

        Explicar cada etapa.

        ══════════════════════════════════════════════

        PARTE 7 — MÓDULOS

        Para cada módulo informar:

        Objetivo

        O que faz

        O que ainda não faz

        Integrações

        Dependências

        Status

        ══════════════════════════════════════════════

        PARTE 8 — BANCO DE DADOS

        Listar:

        Todas as tabelas

        Views

        Triggers

        RPCs

        Functions

        Policies

        Buckets

        ══════════════════════════════════════════════

        PARTE 9 — PERMISSÕES

        Listar:

        Todos os perfis

        Todas as permissões

        Todas as restrições

        ══════════════════════════════════════════════

        PARTE 10 — INTEGRAÇÕES

        Informar todas as integrações existentes.

        Exemplo:

        Supabase

        Focus NFe

        Storage

        Realtime

        Financeiro

        MRP

        APS

        MES

        WMS

        ══════════════════════════════════════════════

        PARTE 11 — FUNCIONALIDADES

        Criar uma lista completa de tudo o que o ERP consegue fazer atualmente.

        Separar por módulo.

        ══════════════════════════════════════════════

        PARTE 12 — FUNCIONALIDADES PENDENTES

        Listar tudo o que ainda está incompleto.

        Não ocultar limitações.

        ══════════════════════════════════════════════

        PARTE 13 — PONTOS DE ATENÇÃO

        Listar:

        bugs conhecidos

        limitações

        dependências

        funcionalidades experimentais

        módulos parcialmente implementados

        ══════════════════════════════════════════════

        PARTE 14 — GUIA DE UTILIZAÇÃO

        Para cada módulo explicar:

        Para que serve

        Quando utilizar

        Quem utiliza

        Fluxo correto

        Boas práticas

        Erros comuns

        ══════════════════════════════════════════════

        PARTE 15 — RELATÓRIO FINAL

        Ao final gerar um documento extremamente detalhado contendo:

        ✓ Inventário completo do ERP

        ✓ Todos os módulos

        ✓ Todas as telas

        ✓ Todas as rotas

        ✓ Todos os cadastros

        ✓ Todos os processos

        ✓ Fluxo operacional

        ✓ Arquitetura

        ✓ Banco

        ✓ Integrações

        ✓ Permissões

        ✓ Funcionalidades

        ✓ Pendências

        ✓ Guia funcional

        ✓ Guia técnico

        Não alterar nenhum arquivo do projeto.

        Não implementar nenhuma funcionalidade.

        Gerar apenas documentação técnica e funcional baseada exclusivamente no estado atual do sistema.
      </div>
    </div>
  );
}
