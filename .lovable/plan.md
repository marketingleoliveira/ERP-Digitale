
# Reestruturação Industrial — Ordem de Produção como núcleo

## Princípios
1. **OP é o único caminho** para movimentar produção, estoque, faturamento e expedição.
2. **Não duplicar dados**: cada domínio (Clientes, Produtos, Estoque, Fiscal, Financeiro) permanece dono das suas tabelas; a OP apenas **referencia** por FK.
3. **Máquina de estados única** com transições validadas por trigger.
4. **Rastreabilidade completa**: cada evento gera linha imutável em `op_eventos`.

---

## Etapa 1 — Fundação de dados (1 migração)

Novas tabelas (todas com RLS via `has_role`):

```text
pedidos                      # Pedido de venda (cabeçalho)
  id, numero, cliente_id → customers, vendedor_id → sales_reps,
  data_pedido, prazo_entrega, status (rascunho/confirmado/cancelado),
  valor_total, condicao_pagamento, observacao

pedido_itens                 # Itens do pedido
  id, pedido_id → pedidos, product_id → products, variante_id → variantes,
  cor_id → cores, estampa_id → estampas, quantidade, valor_unitario

ordens_producao              # OP — núcleo do sistema
  id, numero (sequência atômica), pedido_id → pedidos (nullable p/ OP interna),
  status (enum abaixo), prioridade, data_abertura, data_prevista,
  data_conclusao, maquina_id → maquinas, funcionario_id → funcionarios,
  responsavel_id → auth.users, observacao

op_itens                     # O que a OP deve produzir
  id, op_id → ordens_producao, product_id → products, variante_id,
  cor_id, estampa_id, quantidade_planejada, quantidade_produzida,
  quantidade_aprovada, quantidade_reprovada, unidade

op_consumos                  # Insumos consumidos (fios/tecidos) — baixa estoque
  id, op_id, lote_id → lotes, quantidade, momento, user_id

op_apontamentos              # Tempo/produção reportada por operador
  id, op_id, funcionario_id, maquina_id, inicio, fim,
  quantidade_produzida, quantidade_refugo, observacao

op_qualidade                 # Controle de qualidade
  id, op_id, inspetor_id, resultado (aprovado/reprovado/parcial),
  quantidade_aprovada, quantidade_reprovada, motivo, data

op_entradas_estoque          # Vincula OP → lote produzido
  id, op_id, product_id, variante_id, lote_id → lotes,
  quantidade, data_entrada

op_eventos                   # Audit trail imutável (append-only)
  id, op_id, tipo, de_status, para_status, payload jsonb,
  user_id, created_at

op_faturamento               # Vínculo OP ↔ NF-e
  id, op_id, nota_fiscal_id → notas_fiscais, quantidade_faturada,
  status (pendente/pre_faturado/faturado/expedido)

op_expedicoes                # Expedição/entrega
  id, op_id, nota_fiscal_id, transportadora_id, data_saida,
  data_entrega, rastreio, status
```

**Estados da OP (enum `op_status`):**
`planejada · programada · em_producao · parcial · aguardando_qualidade · reprovada · aprovada · pronta_estoque · pronta_faturamento · faturada · expedida · encerrada`

**Funções SQL:**
- `proximo_numero_op()` — sequência atômica (padrão `nfe_sequencias`).
- `op_transicionar(_op_id, _novo_status, _payload)` — valida transição permitida e grava `op_eventos`.
- Trigger `on_op_status_change` — dispara efeitos colaterais:
  - `pronta_estoque` → cria `lotes` + `op_entradas_estoque`.
  - `faturada` → registra `op_faturamento` (NF-e vinculada).
  - `expedida` → cria `op_expedicoes`.

**Extensões em tabelas existentes:**
- `notas_fiscais.op_id uuid` (opcional) — permite faturar por OP.
- `lotes.op_id uuid` (opcional) — rastreia origem do lote.

---

## Etapa 2 — Backend / Server Functions

`src/services/producao/`:
- `pedido.functions.ts` — criar/confirmar pedido, converter em OP.
- `op.functions.ts` — criar, programar, iniciar, apontar, transicionar, encerrar.
- `qualidade.functions.ts` — inspecionar, aprovar, reprovar (parcial).
- `estoque.functions.ts` — dar entrada via OP, consumir insumo, ajustes.
- `expedicao.functions.ts` — registrar saída, rastreio, entrega.

Regras:
- Nenhuma NF-e de saída pode ser autorizada sem OP no status `pronta_faturamento` (validação server-side).
- Nenhum lote é criado manualmente para produto acabado — só via OP.
- Fiscal (já existente) passa a consumir `op_faturamento`.

---

## Etapa 3 — UI

Novas rotas:
```
/producao                    → Kanban de OPs por status
/producao/pedidos            → Lista + form de Pedido
/producao/op                 → Lista + drill-down por OP
/producao/op/$id             → Detalhe: itens, consumos, apontamentos,
                               qualidade, timeline de eventos, ações de
                               transição contextual
/producao/qualidade          → Fila de OPs aguardando_qualidade
/producao/expedicao          → Fila de OPs faturadas
```

Componentes:
- `OpKanban` — colunas por status, drag opcional.
- `OpTimeline` — linha do tempo de `op_eventos`.
- `OpActionsBar` — botões contextuais por status (Iniciar, Apontar, Enviar p/ QC, Aprovar, Faturar, Expedir).
- `OpFaturarDialog` — cria NF-e pré-preenchida a partir da OP + itens.

Menu: novo grupo **Produção** (Pedidos, OPs, Qualidade, Expedição) — Fiscal e Estoque permanecem como estão mas com badges "via OP".

---

## Etapa 4 — Integrações

| Módulo | Papel | Como consulta OP |
|---|---|---|
| Clientes | Dono do cadastro | `pedidos.cliente_id → customers` |
| Produtos | Dono do cadastro | `op_itens.product_id → products` |
| Estoque | Dono dos lotes | `lotes ← op_entradas_estoque` (entrada) e `op_consumos` (saída) |
| Fiscal | Emissor NF-e | `notas_fiscais.op_id → ordens_producao`; UI de emissão exige OP em `pronta_faturamento` |
| Financeiro (futuro) | Contas a receber | trigger `notas_fiscais autorizada` cria conta a receber com `op_id` |

---

## Etapa 5 — Migração de dados existentes
- Notas fiscais atuais recebem `op_id = null` (legado).
- Nenhum backfill destrutivo; sistema atual continua funcionando em paralelo.
- Um flag em `empresa.exige_op_para_nfe boolean default false` permite ativação gradual (produção pilota antes do bloqueio total).

---

## Diagrama do fluxo

```text
Pedido (rascunho)
  └─ confirmar → gera OP(s) automaticamente
       ↓
   ┌───────── OP ─────────┐
   │ planejada            │
   │  └ programar         │
   │ programada           │
   │  └ iniciar produção  │
   │ em_producao          │
   │  ├ apontamentos      │  op_apontamentos
   │  ├ consumo insumos   │  op_consumos → baixa lote
   │  └ enviar p/ QC      │
   │ aguardando_qualidade │
   │  ├ reprovar → reprovada (fim ou retrabalho)
   │  └ aprovar (total/parcial)
   │ aprovada / parcial   │
   │  └ dar entrada       │  op_entradas_estoque → cria lote
   │ pronta_estoque       │
   │  └ liberar p/ fatur. │
   │ pronta_faturamento   │
   │  └ emitir NF-e       │  op_faturamento ← notas_fiscais
   │ faturada             │
   │  └ expedir           │  op_expedicoes
   │ expedida             │
   │  └ confirmar entrega │
   │ encerrada            │
   └──────────────────────┘
```

---

## Ordem de execução (incremental — cada etapa é entregável)

1. **Etapa 1**: migração de dados (10 tabelas + enum + funções + trigger).
2. **Etapa 2**: server functions de Pedido e OP (fluxo básico).
3. **Etapa 3a**: UI Pedidos + Lista OP + Detalhe OP + Kanban.
4. **Etapa 3b**: Qualidade + Expedição.
5. **Etapa 2b/4**: integração fiscal (bloqueio de NF-e sem OP + `OpFaturarDialog`).
6. **Etapa 5**: flag de ativação gradual + documentação.

---

## Confirmações antes de iniciar

Preciso do seu OK em 3 pontos para começar pela Etapa 1:

1. **Uma OP por item ou uma OP por pedido?** (recomendo: 1 pedido → N OPs, uma por artigo/cor).
2. **Bloqueio duro de NF-e sem OP** já na Etapa 1, ou via flag `exige_op_para_nfe` para migração gradual? (recomendo: flag).
3. **Kanban ou lista tradicional** como visão default de `/producao/op`? (recomendo: Kanban, com toggle para lista).

Após sua confirmação inicio a Etapa 1 (migração das 10 tabelas).
