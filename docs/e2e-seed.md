# Suíte E2E SEED — Digitale Têxtil

Runner dev-only do fluxo operacional **Cliente × Artigo → Pedido → MRP → OP → Produção → Qualidade → Estoque → Pré-Faturamento → Financeiro → Expedição → Entrega**.

## Como executar

1. Acesse `/dev/e2e` autenticado com cargo `desenvolvedor` ou `gerente`.
2. **Diagnóstico** mostra o estado atual do dataset SEED.
3. **Garantir regra Cliente × Artigo** cria a regra vigente R$ 50,00 (idempotente).
4. **Rodar suíte E2E** executa a matriz das 11 etapas e retorna PASS/FAIL/BLOCKED.
5. **Rollback SEED** remove todos os registros prefixados `SEED-` / `TESTE-E2E-`.

## Regras de segurança

- Bloqueado quando `APP_ENV=production`.
- Apenas cargos `desenvolvedor` e `gerente` executam.
- Todo registro criado usa prefixo `SEED-` ou marcador `is_teste_e2e=true`.
- **Nenhuma autorização fiscal é simulada como real.** O modo `MOCK_AUTORIZACAO_E2E` marca a nota com `is_teste_e2e=true` + `provedor_ref='TESTE-E2E-*'`, e nunca produz XML, chave ou DANFE válida.

## Modos fiscais (Etapa 7)

| Modo | Quando | Efeito |
|------|--------|--------|
| A — sem token | `FOCUS_NFE_TOKEN` ausente | Motor tributário + payload validados; emissão bloqueada; nota NÃO fica autorizada. |
| B — homologação | `FOCUS_NFE_TOKEN` presente e `empresa.ambiente_nfe='homologacao'` | Emissão real em homologação (SEFAZ), com chave, protocolo, XML e DANFE. |
| MOCK | Dev-only, via `mockAutorizarNfeE2e({ notaFiscalId })` | Marca nota técnica de teste, dispara triggers internas. Nunca em produção. |

## Bucket de comprovantes

`entrega-comprovantes` (privado). RLS por cargo (logistica / gerente / desenvolvedor).
Upload direto do browser via `supabase.storage.from('entrega-comprovantes').upload(...)`;
metadados registrados por `registrarComprovanteEntrega`. Leitura via signed URL de 5 min.

## Rollback

`SELECT public.seed_rollback();` — SECURITY DEFINER, restrito a `desenvolvedor`, remove em cascata todos os registros SEED sem afetar dados reais.

## Matriz de saída

Cada etapa retorna `{ etapa, nome, status, funcao, esperado, obtido, ids, logs, erro? }`. Exportável em JSON pela UI.
