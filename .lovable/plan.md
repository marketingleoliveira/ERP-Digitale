# FASE 2 — Módulo Compras

Fecha o ciclo da matéria-prima com rastreabilidade completa e integração automática com fornecedores, estoque, lotes, financeiro e produção.

## Fluxo

```text
Solicitação → Cotação → Pedido → Recebimento → Conferência → Entrada Estoque → Contas a Pagar
   (rascunho→aprovada)  (aberta→respondida→escolhida)  (rascunho→enviado→confirmado)
                                                       ↓
                                          gera lotes + movimenta estoque
                                                       ↓
                                          gera parcelas em contas_pagar
```

## Camada de dados (migration única)

Novos enums de status por etapa. Novas tabelas em `public`, todas com RLS (`authenticated` full, `service_role` all) + triggers `set_updated_at`:

- `fornecedores` — cnpj, razao, fantasia, ie, endereço, contato, condicao_pagamento_padrao, ativo. (se já existir em outro nome, reusar)
- `solicitacoes_compra` — numero (seq), solicitante_id, setor, prioridade, justificativa, status (`rascunho|aprovada|cotando|atendida|cancelada`), aprovador_id, aprovada_em
- `solicitacoes_compra_itens` — solicitacao_id, produto_id/variante_id/fio_id (polimórfico via tipo+ref_id), descricao, quantidade, unidade, observacao
- `cotacoes` — numero, solicitacao_id, status (`aberta|respondida|escolhida|cancelada`), prazo_resposta, escolhida_fornecedor_id
- `cotacao_fornecedores` — cotacao_id, fornecedor_id, condicao_pagamento, prazo_entrega_dias, frete, desconto, total, respondida_em, escolhida (bool)
- `cotacao_itens` — cotacao_fornecedor_id, ref_solicitacao_item_id, preco_unitario, quantidade, ipi, icms, subtotal
- `pedidos_compra` — numero (seq), cotacao_id, fornecedor_id, condicao_pagamento, prazo_entrega, frete, desconto, valor_total, status (`rascunho|enviado|confirmado|parcial|recebido|cancelado`), enviado_em, confirmado_em
- `pedidos_compra_itens` — pedido_id, descricao, ref (produto/variante/fio), quantidade, quantidade_recebida, preco_unitario, ncm, cfop, subtotal
- `recebimentos` — numero, pedido_id, nota_fornecedor, chave_nfe, data_recebimento, transportadora, status (`recebido|em_conferencia|conferido|divergente|estornado`), recebedor_id
- `recebimento_itens` — recebimento_id, pedido_item_id, quantidade_recebida, quantidade_aprovada, quantidade_rejeitada, motivo_divergencia, lote_id (fk após entrada), lote_fornecedor
- `contas_pagar` — pedido_id, recebimento_id, fornecedor_id, descricao, parcela, total_parcelas, valor, vencimento, status (`aberta|paga|vencida|cancelada`), pago_em
- `compras_eventos` — tabela de auditoria (entidade, entidade_id, acao, de_status, para_status, payload jsonb, user_id) para rastreabilidade

Sequences: `seq_solicitacao_numero`, `seq_pedido_compra_numero`, `seq_recebimento_numero`.

Functions/triggers:
- `sc_transicionar`, `pc_transicionar`, `rec_transicionar` — valida transições e loga em `compras_eventos`.
- `on_recebimento_conferido()` → para cada item aprovado cria `lotes` (bucket existente), atualiza `pedidos_compra_itens.quantidade_recebida`, atualiza status do pedido (`parcial`/`recebido`), gera parcelas em `contas_pagar` conforme condição de pagamento.
- `on_pedido_confirmado()` → notifica produção (evento em `compras_eventos`).

## Camada de serviço

`src/services/compras/`:
- `solicitacoes.functions.ts` — CRUD + `aprovarSolicitacao`, `cancelarSolicitacao`
- `cotacoes.functions.ts` — criar a partir de solicitação, adicionar fornecedores, registrar respostas, escolher vencedor
- `pedidos.functions.ts` — gerar a partir da cotação escolhida, enviar, confirmar, cancelar
- `recebimentos.functions.ts` — criar recebimento, registrar conferência item a item, confirmar (dispara trigger)
- `contas-pagar.functions.ts` — listar, marcar como paga

Todos com `requireSupabaseAuth`, validação zod, RPC `sc/pc/rec_transicionar`.

## UI (rotas em `src/routes/_app.compras.*.tsx`)

- `/compras` — dashboard (kanban por etapa + KPIs)
- `/compras/solicitacoes` — lista + filtros
- `/compras/solicitacoes/nova` — form multi-item
- `/compras/solicitacoes/$id` — detalhe + ações (aprovar, cotar)
- `/compras/cotacoes` — lista
- `/compras/cotacoes/$id` — comparativo lado a lado dos fornecedores, escolher vencedor
- `/compras/pedidos` — lista
- `/compras/pedidos/$id` — detalhe + enviar/confirmar + impressão
- `/compras/recebimentos` — lista
- `/compras/recebimentos/novo?pedido=` — registrar nota do fornecedor
- `/compras/recebimentos/$id/conferencia` — conferência item-a-item (qtd aprovada/rejeitada, motivo)
- `/compras/contas-pagar` — lista + baixa

Componentes reutilizáveis: `StatusBadge`, `ItensTable`, `AprovacaoDialog`, `ConferenciaGrid`.

## Menu

Novo grupo `Compras` em `src/lib/menu-config.ts` com todos os itens acima. Ícones lucide (`ShoppingCart`, `FileText`, `PackageCheck`, `Receipt`).

## Integrações automáticas (sem código fixo — via triggers)

- Estoque/Lotes: `on_recebimento_conferido` cria lotes vinculados ao `item_id` e `fornecedor_id`, aumentando `quantidade_disponivel`.
- Financeiro: mesma trigger insere parcelas em `contas_pagar` conforme condição.
- Produção: evento `pedido_confirmado` fica disponível em `compras_eventos` para consumo pelo módulo de OP (leitura via query).
- Rastreabilidade: `compras_eventos` liga solicitação↔cotação↔pedido↔recebimento↔lote↔conta.

## Fora de escopo desta fase

- Emissão de NF-e de entrada (só importa dados da nota do fornecedor)
- Integração bancária de pagamento
- Portal do fornecedor

## Entregáveis

1 migration completa, ~5 arquivos `.functions.ts`, ~12 rotas, atualização do menu-config, componentes de UI. Nenhum código fixo — tudo parametrizável (condições, prioridades, motivos).
