# Sistema Digitale Têxtil — ERP Web

O escopo pedido é o de um ERP completo (Dashboard, Clientes, Fornecedores, Representantes, Produtos/Variantes, Estoque, Compras, Vendas, CRM, Financeiro, PCP + Kanban, Facções, Qualidade, Logística, Fiscal, Usuários/Permissões, Admin, Notificações, Busca global, Anexos, Dark mode, Auditoria). Isso equivale a meses de trabalho e muitas dezenas de telas — não cabe em uma única entrega. Vou construir em fases, cada uma funcional de ponta a ponta, começando pela fundação + módulos core, e evoluindo.

## Fase 1 — Fundação e Identidade (esta entrega)

**Objetivo:** deixar a base sólida, navegável e com identidade Digitale Têxtil, pronta para os módulos crescerem em cima.

- Design system Digitale Têxtil (paleta da marca, tipografia, tokens em `src/styles.css`, dark mode nativo)
- Layout ERP: sidebar colapsável com todos os módulos, topbar com busca global, notificações, usuário, breadcrumbs
- Tela de Login "Sistema Digitale Têxtil" (visual, ainda sem backend)
- Metadados, título, favicon, OG tags
- Dashboard executivo com KPIs, gráficos (Recharts) e listas — populado com dados fictícios (mock)
- Rotas TanStack criadas para todos os módulos com telas placeholder consistentes (cards + tabelas + filtros), para navegação imediata
- Módulos já com CRUD visual (mock em memória) e dados fictícios: **Clientes**, **Produtos** (com variantes), **Estoque**, **Pedidos de Venda**, **Ordens de Produção** com **Kanban**
- Componentes reutilizáveis: DataTable (paginação, busca, ordenação, exportação Excel/PDF, impressão), FilterBar, StatCard, PageHeader, EmptyState
- Sistema de notificações (mock) e busca global (mock)

## Fase 2 — Backend Lovable Cloud + Auth + Permissões

- Ativar Lovable Cloud, criar schema Supabase completo (clientes, fornecedores, produtos, variantes, estoque, movimentações, pedidos, OPs, financeiro…)
- RLS + tabela `user_roles` + função `has_role` (admin, gerente, vendedor, produção, financeiro, logística)
- Auth real (email/senha + Google), auditoria de ações
- Migrar mocks da Fase 1 para dados reais + seed de demonstração
- Anexos via Storage

## Fase 3 — Módulos operacionais completos

Fornecedores, Representantes (comissão/metas), Compras (SC→PC→recebimento), CRM (funil, tarefas, follow-up), Facções, Qualidade, Logística/Expedição, Financeiro completo (contas, fluxo de caixa, DRE, boletos), Fiscal (estrutura para NF-e).

## Fase 4 — Refinamentos

Relatórios avançados, integrações (WhatsApp, marketplaces, transportadoras, pagamentos), BI, otimizações de performance para grande volume.

---

## Detalhes técnicos (Fase 1)

- Stack já do template: React 19 + TS + TanStack Start + Tailwind v4 + shadcn
- Gráficos: `recharts` (já disponível via shadcn charts)
- Exportação: `xlsx` + `jspdf` + `jspdf-autotable`
- Ícones: `lucide-react`
- Estado dos mocks: stores locais em `src/lib/mock/*` (fácil substituir por chamadas Supabase na Fase 2)
- Dark mode: classe `.dark` no `<html>`, toggle persistido em localStorage
- Roteamento file-based sob `src/routes/`, layout autenticado sob `_app.tsx` (público: login)
- Paleta Digitale Têxtil: azul profundo corporativo + acento âmbar/dourado, superfícies neutras (ajusto ao logo enviado)

## Perguntas rápidas antes de começar

1. **Paleta exata da marca** — o logo enviado está em branco/transparente e não deu para extrair cor. Pode confirmar as cores oficiais (hex) ou quer que eu proponha uma paleta profissional inspirada em ERPs premium (azul + âmbar) e ajustamos depois?
2. **Login na Fase 1** — deixo apenas visual (entra direto no ERP com usuário mock) e ligo auth real na Fase 2, correto?
3. **Idioma** — 100% pt-BR em toda a UI, confirma?

Se responder rápido a esses 3 pontos eu já parto para a construção da Fase 1.
