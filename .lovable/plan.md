# Plano: Módulo Cliente × Artigo

## Auditoria
- `cliente_artigo` **não existe** (será criada).
- Existem: `customers`, `articles`, `products`, `variantes`, `sales_reps`, `pedidos`, `pedido_itens`.
- Não há tabela de preços padrão; hoje `pedido_itens.valor_unitario` é preenchido manualmente.
- `products.article_id` já vincula produto→artigo.

## Escopo desta entrega

### 1. Migração SQL
**Tabela `cliente_artigo`** com todos os campos pedidos:
- `cliente_id` (FK customers, NOT NULL)
- `artigo_id` (FK articles, NOT NULL)
- `produto_id`, `variante_id` (nullable — especificidade)
- `codigo_cliente`, `descricao_comercial`, `unidade`
- `preco_negociado NUMERIC(14,4) NOT NULL`
- `quantidade_minima`, `desconto_maximo_pct`
- `prazo_entrega_dias`, `condicao_pagamento`
- `representante_id` (FK sales_reps)
- `vigencia_inicio DATE NOT NULL`, `vigencia_fim DATE` (nullable = aberto)
- `ativo BOOL DEFAULT true`, `observacoes TEXT`
- `created_at`, `updated_at`, `created_by`

**Índice único parcial** para impedir duplicidade de vigência sobreposta na mesma chave (cliente+artigo+produto+variante) — via EXCLUDE constraint com `daterange` + `&&`.

**Tabela `cliente_artigo_historico`** — snapshot a cada UPDATE de preço (trigger).

GRANTs + RLS: authenticated CRUD, service_role ALL.

### 2. Função SQL `resolver_preco_cliente_artigo(cliente, artigo, produto, variante, data)`
Retorna a regra mais específica ativa e vigente, respeitando prioridade:
1. cliente + produto + variante
2. cliente + produto
3. cliente + artigo
4. NULL (fallback → chamador usa preço manual)

### 3. Server functions (`src/lib/cliente-artigo.functions.ts`)
- `listarClienteArtigo({ cliente_id?, artigo_id?, ativo?, search? })`
- `getClienteArtigo(id)` + histórico
- `criarClienteArtigo(input)` / `atualizarClienteArtigo(id, input)` / `inativarClienteArtigo(id)`
- `resolverPrecoClienteArtigo({ cliente_id, produto_id, data? })` → `{ origem: 'cliente_produto_variante'|'cliente_produto'|'cliente_artigo'|'nenhum', regra, preco }`
- `importarCsvClienteArtigo(csv)` / `exportarCsvClienteArtigo(filtros)`

Todas com `requireSupabaseAuth`. Zod validation.

### 4. Rotas UI
- `_app.cliente-artigo.tsx` — listagem (DataTable, filtros, botões novo/import/export/simulador)
- `_app.cliente-artigo.$id.tsx` — detalhe com abas **Cadastro** / **Histórico**
- `_app.cliente-artigo.simulador.tsx` — simulador (seleciona cliente + produto/artigo → mostra regra aplicada e origem)

### 5. Componentes
- `cliente-artigo-form-dialog.tsx` (react-hook-form + zod)
- `cliente-artigo-historico-tab.tsx`
- `cliente-artigo-import-dialog.tsx` (upload CSV, preview, valida linhas, insere em batch)

### 6. Integração com Pedido
Em `pedido.functions.ts` (`adicionarItemPedido` / `confirmarPedido`):
- Antes de gravar `valor_unitario`, chamar `resolverPrecoClienteArtigo`.
- Se regra encontrada e `valor_unitario` recebido ≠ preço da regra → só aceitar se `observacao_preco` fornecida (confirmação).
- Gravar `pedido_itens.origem_preco` (nova coluna TEXT) + `regra_cliente_artigo_id` (FK opcional).
- Não sobrescreve valores já digitados sem flag `aceitar_preco_negociado=true`.

### 7. UI Pedido
Badge na linha do item exibindo origem do preço (`Negociado` / `Tabela` / `Manual`).

## Fora de escopo (declarado)
- Aprovação multi-nível de desconto acima do teto.
- Integração com margem/custos industriais além de exibir custo atual ao lado do preço negociado no simulador (read-only).
- Reprocessamento retroativo de pedidos existentes.

## Testes (`cliente-artigo.test.ts`)
- Resolução: variante > produto > artigo > nenhum.
- Vigência: regra expirada não retorna.
- EXCLUDE constraint: rejeita duplicidade sobreposta.
- Trigger de histórico: grava snapshot ao alterar preço.
- CSV import: linhas inválidas rejeitadas, válidas inseridas.

## Arquivos previstos
Criados (8): migração, 1 functions.ts, 3 rotas, 3 componentes, 1 teste.
Editados (2): `pedido.functions.ts`, componente de linha de item do pedido.
