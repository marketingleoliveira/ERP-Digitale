# Plano: Módulo Qualidade `/producao/qualidade`

## Auditoria
- `op_qualidade` existe com: `op_id, inspetor_id, resultado, quantidade_aprovada, quantidade_reprovada, motivo, data`. Falta: `quantidade_reprocesso, defeito, causa, observacao, status, evidencias JSONB, maquina_id/turno` (deriváveis via OP).
- `ordens_producao` tem `status` (enum `op_status` inclui `aguardando_qualidade`, `aprovada`, `reprovada`) — reutilizar `op_transicionar`.
- `op_reprocessos` + função `op_criar_reprocesso(_op_id, motivo, quantidade)` já existem.
- `op_apontamentos` tem `quantidade_produzida, quantidade_refugo` (base do OEE).
- `op_entradas_estoque` existe — só quantidade aprovada gera entrada de lote.

## Escopo desta entrega

### 1. Migração
- ADD COLUMN em `op_qualidade`: `status TEXT DEFAULT 'aguardando'` (aguardando|em_inspecao|aprovada|aprovada_parcial|reprovada|reprocesso), `quantidade_reprocesso NUMERIC`, `defeito TEXT`, `causa TEXT`, `observacao TEXT`, `evidencias JSONB DEFAULT '[]'`, `updated_at`.
- **Função `op_registrar_inspecao(_op_id, _qtd_aprov, _qtd_reprov, _qtd_repro, _defeito, _causa, _obs, _evidencias)`**:
  1. INSERT em `op_qualidade` com `status` derivado.
  2. Se `_qtd_aprov > 0`: cria/atualiza `lotes` (item = produto da OP) e `op_entradas_estoque`.
  3. Se `_qtd_repro > 0`: chama `op_criar_reprocesso`.
  4. Atualiza `op_apontamentos.quantidade_refugo` acumulada.
  5. Chama `op_transicionar` para `aprovada` / `reprovada` (ou mantém `aguardando_qualidade` se parcial).
  6. Bloqueia faturamento quando `quantidade_reprovada > 0` sem `quantidade_aprovada` (via `op_transicao_valida` já existente).
  7. Registra em `op_eventos` (`inspecao_registrada`).
- **View `v_qualidade_indicadores`**: taxa_aprovacao, refugo_pct, reprocesso_pct, defeitos por máquina/artigo/turno (last 30 dias por padrão, agregável via filtro na query).

### 2. Server functions (`src/services/producao/qualidade.functions.ts`)
- `listarFilaInspecao({ maquina_id?, prioridade?, search? })` → OPs em `aguardando_qualidade` + apontamentos pendentes.
- `getOpInspecao(op_id)` → OP + apontamentos + histórico de inspeções + lotes já gerados.
- `registrarInspecao({ op_id, quantidade_aprovada, quantidade_reprovada, quantidade_reprocesso, defeito, causa, observacao, evidencias })` → chama a função SQL.
- `indicadoresQualidade({ periodo_ini, periodo_fim, agrupamento })` → SELECT na view.

Todas com `requireSupabaseAuth`. Zod validation.

### 3. Rotas UI
- `_app.producao.qualidade.tsx` — Fila + tabs (Fila | Indicadores).
  - **Fila**: Table de OPs aguardando inspeção, botão "Inspecionar".
  - **Indicadores**: cards (taxa aprovação, refugo, reprocesso) + tabelas de top defeitos por máquina/artigo/turno.
- `_app.producao.qualidade.$opId.tsx` — Tela de inspeção com formulário (aprovada/reprovada/reprocesso/defeito/causa/obs + upload de evidências para bucket `artigos`) + histórico de inspeções da OP.

### 4. Componentes
- `qualidade-inspecao-form.tsx` — form controlado com validação (aprovada+reprovada+reprocesso ≤ produzida).
- `qualidade-indicadores-cards.tsx`.
- `qualidade-status-badge.tsx`.

### 5. Regras de negócio garantidas
- **Somente aprovada entra no estoque** → SQL só INSERT em `lotes` quando `_qtd_aprov > 0`.
- **Reprovada bloqueia faturamento** → transição para `pronta_faturamento` só a partir de `aprovada` (regra já existente em `op_transicao_valida`).
- **Reprocesso cria OP-filha** → reusa `op_criar_reprocesso`.
- **Refugo/perda no custo** → atualiza `op_apontamentos.quantidade_refugo`; próxima chamada de `op_calcular_custo` reflete perda.
- **OEE** → cálculo lê `quantidade_produzida - quantidade_refugo` já hoje; nada a mudar.
- **Rastreabilidade** → lote criado carrega `numero_lote` = `Q-<numero_op>-<id6>`, permitindo linkar reservas/consumos.

### 6. Testes (`qualidade.test.ts`)
- Aprovação total: gera 1 lote com qtd_aprov, OP → `aprovada`.
- Parcial: qtd_aprov + qtd_reprov, status `aprovada_parcial`, lote só com aprovado.
- Reprovação total: nenhum lote, OP → `reprovada`.
- Reprocesso: cria OP-filha, status `reprocesso`.
- Faturamento bloqueado: tentar `op_transicionar` para `pronta_faturamento` a partir de `reprovada` → erro.

## Fora de escopo (declarado)
- Upload real de imagens (bucket já existe; UI aceita arquivo → path, mas processamento assíncrono/miniatura fica para depois).
- Aprovação em cadeia (2ª conferência).
- Plano de amostragem estatística (AQL).

## Arquivos previstos
- 1 migração
- 1 `qualidade.functions.ts`
- 2 rotas
- 3 componentes
- 1 teste
- Editar `menu-config.ts` (remover `defaultHidden` se aplicável)
