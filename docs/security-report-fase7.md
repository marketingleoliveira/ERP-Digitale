# FASE 7 — Relatório Final de Segurança (RLS Hardening)

Data: 2026-07-07 • Sub-agente: 🛡️ Security Auditor

## Sumário Executivo

| Métrica | Antes | Depois |
|---|---|---|
| Policies com `USING (true)` ou `WITH CHECK (true)` | **109** | **0** ✅ |
| Tabelas públicas sem RLS | 0 | 0 ✅ |
| Função auxiliar RBAC | 1 (`has_role`) | 2 (`has_role`, `has_any_role`) |

## Modelo de Autorização

Roles disponíveis (`app_role`):
`admin` · `gerente` · `desenvolvedor` (bypass) · `financeiro` · `vendedor` · `producao` · `logistica` · `qualidade`

Função central: `public.has_any_role(uuid, app_role[])` — SECURITY DEFINER, `desenvolvedor` sempre passa.

## Matriz de Acesso por Domínio

| Domínio | Tabelas | Leitura | Escrita |
|---|---|---|---|
| **Cadastros** | products, articles, cores, fios, estampas, composicoes, variantes, product_variants, article_fios, agulhas, correias, maquinas, tinturarias, sales_reps | authenticated | gerente/admin |
| **Compras** | fornecedores, cotacoes, cotacao_*, pedidos_compra*, recebimentos*, solicitacoes_compra* | authenticated | financeiro/gerente/admin |
| **Produção** | ordens_producao, op_apontamentos, op_consumos, op_entradas_estoque, op_expedicoes, op_faturamento, op_itens, op_qualidade, lotes | authenticated | producao/logistica/gerente/admin |
| **Estoque (Kardex)** | estoque_movimentos | authenticated | producao/logistica/financeiro/gerente/admin |
| **Vendas / NF** | pedidos, pedido_itens, notas_fiscais, notas_fiscais_itens, notas_fiscais_faturas, customers | authenticated | vendedor/financeiro/gerente/admin |
| **Logística** | romaneios, romaneio_itens, separacoes, separacao_itens, transportadoras, entrega_eventos | authenticated | logistica/(producao)/gerente/admin |
| **Fiscal** | cfop, impostos, uf_icms, uf_aliquotas, ncm_catalogo, regras_tributarias, beneficios_fiscais | authenticated | financeiro/gerente/admin |
| **Financeiro sensível** 🔒 | contas_pagar, contas_receber, movimentos_financeiros, contas_bancarias, centros_custo, comissoes | financeiro/gerente/admin | financeiro/gerente/admin |
| **RH** 🔒 | funcionarios | gerente/admin | gerente/admin |
| **Empresa** 🔒 | empresa, empresa_filiais | financeiro/gerente/admin | (já restrito) |
| **Auditoria** | audit_logs | gerente/admin | insert any authenticated |
| **Profiles** | profiles | próprio usuário OU gerente/admin | (já restrito) |
| **Eventos** | op_eventos, compras_eventos, entrega_eventos, nfe_eventos, nfe_logs, nfe_sequencias | authenticated | domínio correspondente |

## Alertas Residuais (linter Supabase)

Warnings pré-existentes que **não** foram introduzidos por esta fase e devem ser tratados em manutenção contínua:

1. **`0011_function_search_path_mutable`** — algumas funções antigas não fixam `search_path`. Ação recomendada: adicionar `SET search_path = public` em cada `CREATE OR REPLACE FUNCTION`.
2. **`0028_anon_security_definer_function_executable`** — funções SECURITY DEFINER expostas ao role `anon`. Ação recomendada: `REVOKE EXECUTE ... FROM anon, public;` para funções internas (has_role, has_any_role, kardex_movimentar, liquidar_*, op_transicionar, romaneio_transicionar, baixar_estoque_nf, proximo_numero_*).
3. **Leaked password protection (HIBP)** — habilitar no Auth Settings.

## O que nunca pode acontecer

- Nenhuma policy pode voltar a usar `USING (true)` ou `WITH CHECK (true)` em tabelas do domínio de negócio.
- Nenhum acesso a `contas_*`, `movimentos_financeiros`, `comissoes`, `funcionarios` sem role apropriado.
- Nenhum uso de `service_role` no frontend.

## Próximos Passos Sugeridos

1. Fixar `search_path` nas funções legadas e revogar EXECUTE de `anon`.
2. Ativar HIBP no Auth.
3. Adicionar teste E2E que loga com role `vendedor` e valida que `/financeiro/*` retorna vazio.
4. Habilitar `pg_audit` para operações críticas em `contas_pagar` e `movimentos_financeiros`.
