## Sistema de Cargos + Menu DEV

### Visão geral
Criar sistema dinâmico de cargos (nome + permissões de menus), atribuíveis a colaboradores, e um grupo de menu **DEV** visível apenas para quem possui o role fixo `desenvolvedor`.

---

### 1. Banco de dados (migration)

**Tabela `cargos`** (cargos dinâmicos criados pelo dev):
- `id` uuid PK
- `nome` text unique
- `descricao` text
- `permissoes` text[] — lista de URLs de menu permitidos (ex: `['/produtos','/cor']`)
- `created_at`, `updated_at`

**Tabela `user_cargos`** (atribuição N:N usuário↔cargo):
- `id` uuid PK
- `user_id` uuid → auth.users
- `cargo_id` uuid → cargos
- UNIQUE(user_id, cargo_id)

**GRANTs + RLS:**
- `cargos`: SELECT para authenticated; INSERT/UPDATE/DELETE apenas para `has_role(auth.uid(),'desenvolvedor')`
- `user_cargos`: SELECT próprio + desenvolvedor vê tudo; escrita apenas desenvolvedor

**Função `user_has_menu_permission(_user_id, _url)`** (SECURITY DEFINER):
- retorna true se o usuário tem role `desenvolvedor` OU se algum cargo atribuído contém a URL em `permissoes`.

---

### 2. Frontend

**Novo grupo de menu `DEV`** em `src/lib/menu-config.ts`:
- Adicionar `"DEV"` no início de `GROUP_ORDER`
- Novo item: `{ title: "Cargos", url: "/dev/cargos", icon: Briefcase, group: "DEV" }`
- Ícone do grupo DEV no `app-sidebar.tsx` (ex: `Code2`)

**Filtro de visibilidade DEV-only:**
- `app-sidebar.tsx`: usar `useUserRoles` e esconder o grupo `DEV` se o usuário não tiver role `desenvolvedor`.

**Hook `useUserCargos(userId)`** em `src/hooks/use-auth.ts`:
- Carrega cargos do usuário com suas permissões consolidadas.

**Rota `/dev/cargos`** — `src/routes/_app.dev.cargos.tsx`:
- Guard: se `!roles.includes('desenvolvedor')` → mostra "Acesso restrito"
- Aba 1: **Cargos** — CRUD (nome, descrição, permissões via checkboxes de `ALL_MENU_ITEMS`)
- Aba 2: **Atribuições** — lista de usuários (`profiles`) com multi-select de cargos

### 3. Arquivos afetados
- `supabase/migrations/*` (nova migration)
- `src/lib/menu-config.ts` — adiciona grupo DEV e item Cargos
- `src/components/app-sidebar.tsx` — ícone DEV + filtro por role
- `src/hooks/use-auth.ts` — hook `useUserCargos`
- `src/routes/_app.dev.cargos.tsx` — nova página

### Notas
- O role fixo `desenvolvedor` (enum `app_role` existente) continua sendo a "chave-mestra" — cargos dinâmicos são camada adicional de permissões, não substituem os roles do sistema.
- Nesta primeira entrega, permissões == quais menus o cargo vê. Enforcement mais granular (por ação CRUD) pode vir depois.
