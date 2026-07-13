# Módulo Pedidos de Venda — /producao/pedidos

## Escopo

Substituir o `ModulePlaceholder` por um módulo operacional de Pedidos, integrado ao fluxo industrial já existente (OP → Pré-Faturamento → Financeiro → Expedição). Nenhuma tabela nova: reuso total de `pedidos`, `pedido_itens`, `customers`, `products`, `articles`, `variantes`, `sales_reps`, `ordens_producao`, `op_itens`, `notas_fiscais`, `contas_receber`, `op_expedicoes`.

## Auditoria (antes de codar)

Confirmar via `supabase--read_query`:
- Colunas atuais de `pedidos` e `pedido_itens` (a tabela já tem `numero`, `cliente_id`, `vendedor_id`, `prazo_entrega`, `condicao_pagamento`, `observacao`, `valor_total`, `status`, `created_by`).
- Enum de `status` (se for TEXT com CHECK, ampliar via migration mínima adicionando os status pedidos: `rascunho`, `aguardando_aprovacao`, `aprovado`, `confirmado`, `em_producao`, `parcialmente_produzido`, `pronto_faturamento`, `faturado`, `expedido`, `entregue`, `cancelado`).
- Campos faltantes em `pedidos`: `endereco_entrega` (JSONB), `desconto_total` (numeric). Adicionar apenas se ausentes.
- Campos em `pedido_itens`: `desconto` (numeric) — adicionar se ausente.

## Entregáveis

### 1. Server functions (`src/services/producao/pedido.functions.ts`)
Ampliar o arquivo existente (que já tem `criarPedido`, `confirmarPedido`) com:
- `listarPedidos({ status?, clienteId?, search? })` — join `customers.nome`, `sales_reps.nome`, agrega contagem de OPs, situação fiscal (existe NF autorizada?), expedição.
- `getPedido({ id })` — pedido + itens + OPs + notas + contas_receber + expedições + eventos (para as abas).
- `atualizarPedido({ id, patch })` — bloqueia edição de itens quando `status IN ('em_producao','faturado','expedido','entregue')` sem flag `forcarAuditoria`.
- `cancelarPedido({ id, motivo })` — só se nenhuma OP passou de `em_producao`; grava em `audit_logs`.
- `gerarOpsPedido` — extrai a criação de OPs do `confirmarPedido` para permitir geração posterior (validando `products.article_id`, existência de BOM em `article_bom`, existência de roteiro em `roteiros`).
- `derivarStatusPedido` — helper server-side que recomputa o status agregado (rascunho → confirmado → em_producao → parcialmente_produzido → pronto_faturamento → faturado → expedido → entregue) a partir das OPs, NF-e e romaneios vinculados.

### 2. Rotas

- `src/routes/_app.producao.pedidos.tsx` — **listagem** com:
  DataTable: número, cliente, representante, data, prazo, valor total, status pedido, situação produção (badges: `x/y OPs concluídas`), fiscal (NF autorizada?), expedição (romaneio saiu?).
  Filtros: status, cliente, período. Botão "Novo pedido" → dialog de criação.
- `src/routes/_app.producao.pedidos.$id.tsx` — **detalhe** com abas via `Tabs` do shadcn:
  - **Resumo**: cabeçalho, cliente, endereço, condição de pagamento, totais, status, ações (Confirmar, Gerar OP, Cancelar, Editar).
  - **Itens**: tabela editável em `rascunho`/`aguardando_aprovacao`/`aprovado`; read-only depois.
  - **OPs**: lista das OPs geradas com link para `/producao/op/$id`, status e produção parcial.
  - **Fiscal**: NF-e vinculadas via `notas_fiscais.op_id ∈ OPs`, com status SEFAZ e link `/fiscal?nf=...`.
  - **Financeiro**: `contas_receber` das NFs, parcelas, status pagamento.
  - **Expedição**: `op_expedicoes` + romaneios.
  - **Histórico**: eventos consolidados (`op_eventos` das OPs + `audit_logs` do pedido).

### 3. Componentes

- `src/components/producao/pedido-form-dialog.tsx` — form de criação/edição com react-hook-form + zod. Seletores async de cliente (`customers`), representante (`sales_reps`), condição de pagamento (autocomplete simples). Itens com combobox de produto→artigo→variante→cor, quantidade, preço, desconto. Total calculado em tempo real.
- `src/components/producao/pedido-status-badge.tsx` — mapa cor/label por status.
- `src/components/producao/pedido-situacoes.tsx` — mini badges (Produção `2/3`, Fiscal `autorizada`, Expedição `saiu`).

### 4. Migration (mínima e condicional)

Só se auditoria confirmar campos ausentes:
```sql
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS endereco_entrega JSONB,
  ADD COLUMN IF NOT EXISTS desconto_total NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(14,2) DEFAULT 0;
-- ampliar CHECK do status se restritivo
```
Trigger em `pedidos` para gravar `audit_logs` (entidade=`pedido`) em cada UPDATE.

### 5. Integrações (sem código novo — só verificação)

- MRP: `mrp.functions.ts` já lê `pedido_itens` como demanda → OK.
- Sugestão de OP: `gerarOpsPedido` reusa `proximo_numero_op` + `ordens_producao` + `op_itens` (já feito em `confirmarPedido`).
- Pré-faturamento: `pre-faturamento.functions.ts` opera sobre a OP; aba Fiscal apenas exibe.
- Contas a receber: trigger `on_nfe_autorizada_financeiro` já cria — aba Financeiro apenas exibe.
- Expedição: `op_expedicoes` + `romaneios` — aba Expedição consulta.

### 6. Testes (`src/services/producao/pedido.test.ts`)

- Pedido simples 1 item → confirmar → 1 OP criada com `numero` sequencial.
- Pedido múltiplos itens → confirmar → N OPs, cada uma com `op_itens` correto.
- Edição pré-produção: permitida; pós-produção: bloqueada sem `forcarAuditoria`.
- Cancelamento com OP em `planejada`: OK; com OP `em_producao`: rejeitado.
- Rastreabilidade: `getRastreabilidadeOp` (já existe) resolve pedido → OP → NF → contas.
- `derivarStatusPedido`: OPs mistas → `parcialmente_produzido`; todas faturadas → `faturado`.

## Ordem de execução

1. `supabase--read_query` para confirmar colunas/status faltantes.
2. Migration condicional (só se necessário) + trigger de audit.
3. Ampliar `pedido.functions.ts`.
4. Criar componentes (`pedido-status-badge`, `pedido-situacoes`, `pedido-form-dialog`).
5. Reescrever `_app.producao.pedidos.tsx` (listagem).
6. Criar `_app.producao.pedidos.$id.tsx` (detalhe com abas).
7. Testes.
8. Verificar build.

## Arquivos previstos

Criados: 4 (`_app.producao.pedidos.$id.tsx`, `pedido-form-dialog.tsx`, `pedido-status-badge.tsx`, `pedido-situacoes.tsx`) + 1 teste + eventual migration.
Alterados: 2 (`_app.producao.pedidos.tsx`, `pedido.functions.ts`).

## Fora do escopo

- Tabela de preços por cliente/artigo (rota `/cliente-artigo` continua placeholder — depende de definição de regras de precificação com o usuário).
- Aprovação por workflow multi-nível (por ora `aguardando_aprovacao` → `aprovado` é ação manual de gerente via `has_role`).
- PDF do pedido / envio por e-mail (fase posterior).
