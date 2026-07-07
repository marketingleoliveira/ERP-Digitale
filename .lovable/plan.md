
# Motor Tributário — Fase de Inteligência Fiscal

## 1. Auditoria do que já existe

**Presente e utilizável (reaproveitar):**
- `empresa` → `regime_tributario`, `uf`, `codigo_municipio`
- `customers` → `uf`, `entrega_uf`, `contribuinte_icms`, `regime_especial`, `suframa`, `icms`
- `products` → `ncm`, `cest`, `origem`, `cfop_padrao`, `cst_icms`, `csosn`, `aliq_icms`, `cst_ipi`, `aliq_ipi`, `cst_pis`, `aliq_pis`, `cst_cofins`, `aliq_cofins`
- `cfop` → catálogo (48 registros populados)
- `uf_aliquotas` → 28 UFs com ICMS interno, interestadual, ICMS ST, FCP
- `notas_fiscais_itens` → `ncm`, `cfop`, `base_icms`, `aliquota_icms`, `valor_icms`
- `impostos` → tabela genérica pouco estruturada (será deprecada; mantida por compatibilidade)

**Ausente (a criar):**
- Tabela mestre de **NCM** com CST/CSOSN/alíquotas padrão por regime
- **Regras tributárias** parametrizáveis (por UF orig/dest, tipo cliente, regime, operação, tipo produto)
- **Benefícios fiscais** (redução base, isenção, diferimento) por UF/NCM
- **MVA/IVA-ST** por NCM e UF
- Motor de cálculo unificado (service TypeScript)

## 2. Novas tabelas (migration)

```text
ncm_catalogo
  codigo (PK), descricao, cest_sugerido, ex_tipi,
  aliq_ipi_padrao, cst_ipi_padrao, cst_pis_padrao, aliq_pis_padrao,
  cst_cofins_padrao, aliq_cofins_padrao

regras_tributarias  (motor principal)
  id, nome, prioridade INT, ativo,
  # escopo (todos opcionais → NULL = curinga)
  uf_origem, uf_destino,
  regime_tributario_emitente,        -- simples|presumido|real
  tipo_cliente,                       -- pj_contribuinte|pj_nao_contrib|pf|orgao_publico|exterior
  tipo_operacao,                      -- venda|devolucao|remessa|retorno|bonif|amostra|industrializacao|exportacao
  ncm_prefix,                         -- ex. "6006" casa qualquer NCM que começa com
  cest,
  finalidade,                         -- consumo|revenda|industrializacao|ativo
  # saída
  cfop TEXT NOT NULL,
  cst_icms, csosn,
  aliq_icms, red_base_icms_pct,
  calcula_st BOOLEAN, mva_pct, aliq_icms_st,
  aliq_fcp, aliq_fcp_st,
  cst_ipi, aliq_ipi,
  cst_pis, aliq_pis,
  cst_cofins, aliq_cofins,
  calcula_difal BOOLEAN,
  observacao

beneficios_fiscais
  id, uf, ncm_prefix, tipo (reducao|isencao|diferimento|suspensao),
  percentual, base_legal, vigencia_inicio, vigencia_fim, ativo
```

Colunas adicionadas em `customers`: `consumidor_final BOOLEAN`, `indicador_ie TEXT` (1|2|9).
Colunas adicionadas em `empresa`: `crt INT` (1 Simples, 2 Simples excesso, 3 Regime Normal).

RLS: leitura autenticados; escrita `desenvolvedor`/`gerente`.

## 3. Motor de cálculo (TypeScript puro, sem I/O)

`src/services/fiscal/tax-engine/`
```text
types.ts              # TaxContext, TaxResult, ItemInput
resolver.ts           # resolveRegra(ctx) — busca regra na tabela com maior prioridade compatível
calculators/
  icms.ts             # base, redução, alíquota, valor, DIFAL, FCP
  icms-st.ts          # MVA, base ST, valor ST, FCP-ST
  ipi.ts
  pis-cofins.ts
index.ts              # calcularItem(ctx, item) → { cfop, cst, csosn, bases, valores, totais }
                      # calcularNota(ctx, itens) → agregação
```

O engine recebe **snapshot** (dados já carregados) — nada de queries dentro dos cálculos. Puro, testável.

## 4. Camada de dados (server functions)

`src/services/fiscal/tax-rules.functions.ts`
- `listRegras`, `upsertRegra`, `removeRegra`
- `listBeneficios`, `upsertBeneficio`
- `listNcms`, `upsertNcm`
- `previewCalculoItem(pedido_item_id)` — carrega contexto e devolve resultado do engine (para UI de simulação)

## 5. Integração com Pré-Faturamento

Novo hook `useCalculoTributario(pedidoId)`:
- Carrega empresa emitente, cliente, itens (com NCM/CFOP padrão) e regras.
- Aplica engine.
- Retorna totais e por item: base/valor ICMS, ST, IPI, PIS, COFINS, FCP, DIFAL.

Tela `/fiscal/pre-faturamento/:pedidoId` (já existe? verificar; caso contrário, criar somente a **prévia de cálculo** — sem emissão).

## 6. Telas de administração (grupo Fiscal)

- `/fiscal/ncm` — CRUD NCM com CST/alíquotas padrão
- `/fiscal/regras-tributarias` — CRUD de regras com filtros por escopo, ordenação por prioridade, botão "Simular"
- `/fiscal/beneficios` — CRUD benefícios fiscais
- `/fiscal/simulador` — simulador manual (escolhe cliente + produto + qtd → mostra cálculo detalhado)

## 7. Testes

`src/services/fiscal/tax-engine/__tests__/`
- Venda SP→SP consumidor final PF (ICMS interno, sem DIFAL, sem ST)
- Venda SP→MG contribuinte revenda (interestadual 12%, sem DIFAL)
- Venda SP→RJ não contribuinte (interestadual + DIFAL + FCP 2%)
- Venda com ST (MVA aplicada)
- Simples Nacional (CSOSN 102, sem destacar ICMS)
- Devolução (CFOP invertido, mesmo CST)
- Exportação (CFOP 7xxx, isenção)

## 8. Fora de escopo desta fase

- Geração XML da NF-e
- Assinatura digital / SEFAZ
- DANFE
- Cancelamento / CCe / Inutilização

Essas etapas consumirão o motor via `calcularNota()` na fase seguinte, sem duplicar regras.

## Arquivos a criar/alterar

- Migration: `ncm_catalogo`, `regras_tributarias`, `beneficios_fiscais` + colunas em `customers`/`empresa`
- `src/services/fiscal/tax-engine/*` (engine puro + testes)
- `src/services/fiscal/tax-rules.functions.ts` (server fns)
- `src/routes/_app.fiscal.ncm.tsx`
- `src/routes/_app.fiscal.regras-tributarias.tsx`
- `src/routes/_app.fiscal.beneficios.tsx`
- `src/routes/_app.fiscal.simulador.tsx`
- `src/hooks/use-calculo-tributario.ts`
- `src/lib/menu-config.ts` (novos itens no grupo Fiscal)

## Riscos

- Cobertura fiscal é infinita — o motor cobre o comum; regras excepcionais entram como novas linhas em `regras_tributarias` sem alterar código.
- Tabela `impostos` legada permanecerá para não quebrar telas existentes; será marcada como deprecada.
- MVA e benefícios são estaduais e mudam por convênio; entrada manual até integrar fonte externa.
