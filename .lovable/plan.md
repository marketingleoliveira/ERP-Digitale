
# Sprint 0 + Fase 1 do PCP — Digitale Têxtil

## Diagnóstico atual (auditoria dos dados mestres)

| Entidade | Tabela | Registros | Status |
|---|---|---:|---|
| Empresa emitente | `empresa` | 0 | 🔴 Bloqueador |
| Fornecedores | `fornecedores` | 0 | 🔴 Bloqueador |
| Clientes | `customers` | 1 | 🟡 Insuficiente |
| Lotes iniciais | `lotes` | 0 | 🔴 Bloqueador |
| Artigos (ficha técnica) | `articles` | 33 | 🟢 OK (auditar completude) |
| BOM | `article_bom` | 0 | 🔴 Bloqueador |
| Máquinas | `maquinas` | 25 | 🟢 OK |
| Capacidade máquina | `maquina_capacidade` | 0 | 🔴 Bloqueador |
| Turnos | *(inexistente)* | — | 🔴 Criar tabela |
| Calendário produtivo | *(inexistente)* | — | 🔴 Criar tabela |
| Roteiros | *(inexistente)* | — | 🔴 Criar (Fase 1) |
| Operações produtivas | *(inexistente)* | — | 🔴 Criar (Fase 1) |
| Reserva de lote | *(inexistente)* | — | 🔴 Criar (Fase 1) |
| OEE | `vw_oee_maquina` (view) | — | 🟢 Existe — validar |

---

## SPRINT 0 — Dados Mestres (sem lógica de PCP ainda)

Objetivo: deixar o ERP com dados suficientes para o PCP calcular, sequenciar e reservar.

### S0.1 — Schema mínimo faltante
Migration única criando:
- `turnos` (id, nome, hora_inicio, hora_fim, dias_semana int[], intervalo_min, ativo)
- `calendario_produtivo` (id, data, tipo `util|feriado|manutencao|parada`, turno_id?, observacao)
- `maquina_turnos` (maquina_id, turno_id) — vínculo N:N
- GRANTs + RLS `authenticated` (padrão do projeto)

### S0.2 — Telas de cadastro no menu **Cadastros → PCP**
Formulários CRUD simples (padrão shadcn já em uso):
- **Turnos** — CRUD + preview semanal
- **Calendário produtivo** — grid mensal, marcar feriados/paradas
- **Máquina × Turno** — atribuir turnos a cada máquina
- **Capacidade máquina** — form para preencher `maquina_capacidade` (kg/h, un/h, setup_min, eficiência_alvo)

### S0.3 — Wizard de povoamento inicial (guiado)
Rota `/dev/sprint0-checklist` já parcialmente iniciada — expandir para checklist com status ao vivo:
1. Empresa cadastrada (CNPJ, IE, CRT, série, próx. nº)
2. ≥ 1 fornecedor ativo
3. ≥ 5 clientes com endereço/UF/IE completos
4. Artigos com NCM, origem, unidade, `cfop_padrao`
5. BOM cadastrado para pelo menos os artigos com OP planejada
6. Lotes iniciais (saldo abertura) importados via CSV
7. Turnos criados
8. Calendário do ano corrente criado
9. Capacidade preenchida em 100% das máquinas ativas

Cada item exibe ✅/❌ + link direto para a tela de cadastro.

### S0.4 — Importadores CSV
- Lotes iniciais (item, quantidade, custo, data_entrada)
- BOM (artigo, componente, quantidade, perda%)
- Clientes/Fornecedores

Entrega Sprint 0: nenhuma regra de PCP muda; apenas dados + telas + checklist.

---

## FASE 1 — PCP Básico (após checklist S0 100% verde)

### F1.1 — Schema PCP
Migration com:
- `operacoes` (código, nome, tipo `tecelagem|tinturaria|acabamento|corte|costura|expedicao`, setup_padrao_min, ativo)
- `roteiros` (id, article_id, versao, ativo, observacao) — 1 roteiro por artigo/versão
- `roteiro_etapas` (roteiro_id, seq, operacao_id, maquina_preferencial_id?, tempo_min_por_un, tempo_setup_min, perda_pct)
- `op_reservas_lote` (op_id, lote_id, quantidade_reservada, status `reservado|consumido|liberado`)
- `pcp_programacao` (op_id, maquina_id, inicio_previsto, fim_previsto, sequencia, status)
- Índices em (`maquina_id`, `inicio_previsto`), (`op_id`)
- GRANTs + RLS

### F1.2 — Motor de programação (sem APS)
Server function `pcp.programar(op_id)`:
1. Lê roteiro do artigo da OP.
2. Para cada etapa: escolhe máquina preferencial (ou primeira compatível livre).
3. Calcula `inicio` = próximo slot livre da máquina respeitando turnos + calendário.
4. `fim` = `inicio + setup + (qtd × tempo_un)`.
5. Grava em `pcp_programacao`.
6. Reserva lotes disponíveis via `op_reservas_lote` (FEFO já usado em `baixar_estoque_nf`).

Regra: **não** otimiza gargalo, **não** re-sequencia automaticamente. Reprogramação = manual (drag no Gantt).

### F1.3 — Telas PCP (menu novo **PCP**)
- **Roteiros** — CRUD com editor de etapas drag-to-reorder
- **Operações** — CRUD simples
- **Capacidade & Turnos** — visão consolidada por máquina (h disponíveis/semana)
- **Programação por máquina** — timeline horizontal (uma linha por máquina, blocos = OPs). Filtros: máquina, semana.
- **Gantt inicial** — visão global usando `@nivo/timeline` ou `react-calendar-timeline` (biblioteca leve, sem APS).
- **Dashboard Industrial** — cards: OPs ativas, OEE médio (da `vw_oee_maquina`), horas planejadas vs realizadas, top 5 atrasos.

### F1.4 — Integração com fluxo existente
- Ao criar OP: se artigo tem roteiro ativo, chamar `pcp.programar` automaticamente.
- Ao apontar produção (`op_apontamentos`): atualizar `fim_realizado` na programação.
- Ao transicionar OP para `pronta_estoque`: liberar reservas restantes.

---

## Fora de escopo (confirmado, não implementar)
APS, IA, previsão de demanda, IoT, otimização de gargalo, MRP automático.

---

## Ordem de execução proposta
1. **Aprovar este plano.**
2. Executar S0.1 → S0.2 → S0.3 → S0.4 (1 entrega).
3. Usuário popula dados via telas + CSV até checklist 100% verde.
4. Executar F1.1 → F1.2 → F1.3 → F1.4.

## Detalhes técnicos
- Stack: TanStack Start + Supabase + shadcn (padrão do projeto).
- Todas as tabelas novas com RLS `authenticated` + GRANT `service_role`.
- Roles: `desenvolvedor` e `gerente` para escrita em roteiros/capacidade; `operador` só leitura.
- Nenhuma tabela existente será alterada — apenas novas.
- Gantt: instalar `react-calendar-timeline` (leve, ~40 kB gzip, sem deps nativas — compatível com Cloudflare Worker SSR pois é client-only).

Confirma o plano? Posso começar pela Sprint 0 (schema + telas + checklist) numa entrega só.
