## Módulo de Expedição — /producao/expedicao

Substitui o placeholder por um módulo operacional integrado a Pedidos, OPs, NF-e, Romaneios e Entregas, reutilizando ao máximo o esquema existente.

### 1. Migração (SQL)

Estender `op_expedicoes` (hoje mínima) com colunas necessárias, sem quebrar dados atuais:

- `pedido_id uuid` (FK pedidos, nullable — expedição pode ser por OP ou por pedido)
- `volumes int default 1`, `peso_bruto numeric`, `peso_liquido numeric`
- `frete_tipo text` (CIF/FOB/Terceiros/Remetente/Destinatario/SemFrete) via CHECK
- `separador_id uuid`, `conferente_id uuid`, `expedidor_id uuid`
- `divergencias jsonb default '[]'`
- Ampliar CHECK de `status` para os 10 estados solicitados (`aguardando`, `em_separacao`, `separado`, `em_conferencia`, `conferido`, `expedido`, `em_transito`, `entregue`, `ocorrencia`, `devolvido`).
- Trigger `updated_at`.

Nova tabela `expedicao_itens_lote` (vínculo lote↔expedição):
- `expedicao_id`, `op_item_id`, `lote_id`, `quantidade`, `product_id`, `variante_id`.
- GRANTs + RLS `authenticated`.

Função SQL `exp_registrar_evento(expedicao_id, evento, descricao, local)` grava em `entrega_eventos` (via `romaneio_id` quando existir) e em `op_eventos`, e atualiza `status` de `op_expedicoes` conforme evento.

Função SQL `exp_transicionar(expedicao_id, novo_status, motivo)`:
- Valida matriz de transição.
- Bloqueia passagem a `expedido` sem `nota_fiscal_id` cuja NF esteja `autorizada` (`status_sefaz='autorizada'`), exceto quando `motivo` começa com "OVERRIDE_ADM:" **e** o usuário tem role `admin`.
- Grava evento; atualiza `updated_at`.

Função SQL `exp_separar_lote(expedicao_id, op_item_id, lote_id, quantidade)`:
- Verifica `lotes.quantidade_disponivel >= quantidade` (via `estoque_movimentos` acumulado ou coluna existente).
- Cria `expedicao_itens_lote` e reserva estoque (movimento `saida_expedicao` pendente).

### 2. Server functions (`src/services/producao/expedicao.functions.ts`)

Todas com `requireSupabaseAuth`.

- `listarFilaExpedicao({ status?, search? })` — pedidos com OP finalizada e NF autorizada + expedições em andamento.
- `getExpedicao(id)` — cabeçalho + itens + lotes + eventos + NF + transportadora.
- `criarExpedicao({ pedido_id | op_id })` — cria em status `aguardando`.
- `separarLote(...)` → chama `exp_separar_lote`.
- `registrarConferencia({ expedicao_id, divergencias[] })` → status `conferido` ou registra divergência.
- `fecharRomaneio({ expedicao_id, transportadora_id, frete_tipo, volumes, peso_bruto, peso_liquido, rastreio })` — cria/atualiza `romaneios` e `romaneio_itens`, vincula NF.
- `transicionar({ expedicao_id, novo_status, motivo? })` → `exp_transicionar`.
- `registrarOcorrencia({ expedicao_id, tipo, descricao })` → grava evento + status `ocorrencia`.
- `registrarEntrega({ expedicao_id, data_entrega, comprovante_url? })` → status `entregue`.
- `indicadoresExpedicao({ dias? })` — tempo médio separação→expedição, on-time delivery, ocorrências.

### 3. UI

- `src/routes/_app.producao.expedicao.tsx` — abas **Fila** / **Indicadores**. Fila: DataTable com pedido, cliente, NF, status, ações (iniciar separação, abrir).
- `src/routes/_app.producao.expedicao.$id.tsx` — cabeçalho + abas:
  - **Separação** (lotes por item, estoque disponível)
  - **Conferência** (checklist + divergências)
  - **Romaneio** (transportadora, frete, volumes, peso, rastreio, botão imprimir)
  - **Entrega** (eventos, upload de comprovante, status)
  - **Histórico**
- Componentes: `expedicao-status-badge.tsx`, `expedicao-separacao-form.tsx`, `expedicao-conferencia-form.tsx`, `expedicao-romaneio-form.tsx`, `expedicao-etiqueta-print.tsx`.
- Menu já existente `/producao/expedicao` — sem alteração no menu.

### 4. Regras aplicadas

1. Bloqueio de expedição sem NF autorizada (override admin via `has_role`).
2. `exp_separar_lote` valida saldo do lote.
3. Vínculo lote↔OP↔pedido↔NF preservado via `expedicao_itens_lote` + `nota_fiscal_id` em `op_expedicoes`.
4. Todo evento grava `user_id`, `data`, delta em `audit_logs`.
5. Impressão via rota dedicada `/producao/expedicao/$id/romaneio-print` (print-friendly).
6. Rastreabilidade: `rastreabilidade.functions.ts` já consulta lotes/OP; nada a mudar além de adicionar join com expedição.
7. Ocorrências/devoluções listadas em aba própria via `entrega_eventos`.

### 5. Testes (`expedicao.test.ts`)

- Bloqueio sem NF autorizada.
- Override admin permitido.
- Separação acima do saldo do lote → erro.
- Transição inválida → erro.
- Fluxo completo aguardando → entregue.
- Ocorrência mantém histórico e status `ocorrencia`.

### Fora de escopo

- Integração real com API de transportadora (rastreio manual).
- Emissão de etiqueta ZPL (apenas HTML print).
- Devolução com nota de retorno fiscal (apenas registro de evento).
