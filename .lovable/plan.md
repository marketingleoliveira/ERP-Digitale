
# Suíte E2E SEED — Etapas 1 a 11

Objetivo: transformar o dataset SEED atual num cenário E2E reproduzível, idempotente e executado pelas **mesmas server functions e RPCs** da UI, sem afrouxar nenhuma regra de negócio.

## Princípios (não-negociáveis)

- Prefixo `SEED-` / `TESTE E2E` em todo registro; nenhum documento real.
- Bloqueado em produção: guard `if (process.env.APP_ENV === 'production') throw`.
- Nada de `INSERT` direto para "passar" — sempre via server function/RPC oficial.
- Sem autorização SEFAZ simulada. Modo MOCK é claramente marcado e proibido em prod.
- Idempotente: cada passo faz upsert por chave natural (`SEED-*`) e é seguro re-executar.
- Rotina de rollback separada, também com guard de ambiente.

## Entregáveis

### 1. Server functions do harness E2E (`src/services/e2e/`)

Arquivos client-safe (`*.functions.ts`), todos com `requireSupabaseAuth` + checagem de role `desenvolvedor`/`gerente` e guard `APP_ENV !== 'production'`:

- `seed.functions.ts`
  - `seedEnsureBase()` — cria/garante cliente `SEED CLI LTDA`, artigo `SEED-ART-01`, produto `SEED-PROD-01`, variante, roteiro, máquina, turno, lote `SEED-LOTE-01` (500 kg), BOM.
  - `seedEnsureClienteArtigo()` — upsert regra vigente R$ 50,00 (etapa 1).
  - `seedEnsurePedido()` — cria pedido `SEED-PED-001` 300 kg chamando o fluxo comercial oficial, resultando em `origem_preco = 'cliente_artigo'` naturalmente.
  - `seedRollback()` — remove tudo com prefixo `SEED-`/`TESTE E2E` em ordem inversa de dependência.

- `e2e-runner.functions.ts` — orquestrador; para cada etapa retorna `{ etapa, status: 'PASS'|'FAIL'|'BLOCKED', esperado, obtido, ids, funcao, logs }`. Chama exclusivamente funções já existentes:
  - Etapa 2: `computeOpSuggestions` + `gerarOpDaSugestao` (asserta 324,45 / 500 / 0 / 21,25 / ~15,27 / ~1,91).
  - Etapa 3: RPC de reserva de lote existente (asserta 500 / 324,45 / 175,55).
  - Etapa 4: `op_transicionar` + `op_apontamentos` + `op_consumos` oficiais.
  - Etapa 5: `op_registrar_inspecao` (300/0/0) + cenário paralelo parcial (aprovada/reprovada/reprocesso, cria OP-filha via `op_criar_reprocesso`).
  - Etapa 6: função oficial de pré-faturamento (`src/services/fiscal/pre-faturamento.functions.ts`).
  - Etapa 7 Modo A: `calcularTributosDaNota` + `buildFocusNfePayload` + tenta emitir → asserta bloqueio por token ausente, sem marcar autorizada.
  - Etapa 7 Modo B: só roda se `process.env.FOCUS_NFE_TOKEN` presente **e** `empresa.ambiente_nfe='homologacao'`; emite/consulta/CC-e/cancela em ref `TESTE-E2E-*`.
  - Etapa 7 MOCK: `mockAutorizacaoE2E({ notaId })` — dev-only, marca a NF como `status_sefaz='autorizada_teste_e2e'` (novo valor, **não** `autorizada`) e dispara efeitos internos via função dedicada `on_nfe_autorizada_op_teste` (espelha a real) — nunca gera XML nem chave real; documento fica marcado `is_teste_e2e=true`.
  - Etapas 8–10: usa funções oficiais (`contas_receber` trigger, `exp_transicionar`, `exp_separar_lote`, `romaneio_transicionar`, `entrega_eventos`).

### 2. Migração SQL

- Coluna `notas_fiscais.is_teste_e2e boolean default false` + status extra `'autorizada_teste_e2e'` no CHECK; triggers financeiras/expedição aceitam ambos, mas nunca produzem XML/impressão pública.
- Bucket privado `entrega-comprovantes` + RLS por cargo; coluna `entrega_eventos.comprovante_path text`.
- Função `seed_rollback()` SECURITY DEFINER que apaga cascata por prefixo `SEED-`.

### 3. Upload real de comprovante (etapa 10)

- Bucket privado `entrega-comprovantes`, limite 10 MB, aceita `application/pdf|image/jpeg|image/png`.
- Server fn `uploadComprovanteEntrega({ eventoId, file })` — valida mime/tamanho, grava em `entregas/{ano}/{eventoId}/{uuid}.ext`, guarda path, gera signed URL sob demanda (`getComprovanteUrl`).
- UI: input no drawer da entrega + link "Baixar" via signed URL.
- Contrato futuro de rastreamento documentado em `docs/rastreamento-transportadora.md` (apenas doc, sem implementação).

### 4. UI de operação (`/_app/dev/e2e`)

Página dev-only (guard por role): botões "Preparar SEED", "Rodar E2E", "Rollback"; renderiza matriz PASS/FAIL/BLOCKED por etapa com IDs, esperado × obtido, função usada, logs; export JSON.

### 5. Testes automatizados

- `src/services/e2e/e2e-runner.test.ts` (Vitest) — mocka Supabase e valida a lógica de asserts/idempotência do runner.
- `tests/e2e/seed-flow.spec.ts` (Playwright, executado via shell conforme guia de browser-use) — login como desenvolvedor, aciona os 3 botões, valida a matriz renderizada e checa RLS negando acesso ao bucket para usuário sem cargo.

### 6. Documentação

- `docs/e2e-seed.md` — como rodar, variáveis, matriz de saída, limites do MOCK, checklist de rollback, tabela de RLS/permissões.

## Fora de escopo

- API real de rastreamento de transportadora (só contrato).
- Emissão fiscal em produção.
- Alterações de regras de negócio existentes.

## Ordem de execução dos passos técnicos

1. Migração (colunas + bucket + `seed_rollback`).
2. `seed.functions.ts` + rota `/_app/dev/e2e` mínima.
3. `e2e-runner.functions.ts` cobrindo etapas 1–6.
4. Modo A/B/MOCK da etapa 7.
5. Etapas 8–10 + upload de comprovante.
6. Etapa 11 (rastreabilidade — reusa `getRastreabilidadeOp`).
7. Testes Vitest + Playwright + doc.
