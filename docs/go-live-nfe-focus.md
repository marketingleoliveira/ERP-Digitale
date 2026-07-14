# GO-LIVE NF-e via Focus NFe — Checklist e Parecer Final

Empresa: **Digitale Têxtil** • Provedor homologado: **Focus NFe**
Arquitetura oficial: `ERP → FiscalService → Focus Adapter → Focus NFe → SEFAZ`

> **Regra:** este checklist precisa estar 100% ✅ antes de virar `ambiente_nfe = producao`.

---

## 1. Checklist de Entrada em Produção

### 1.1 Certificado Digital A1 (na Focus NFe)
- [ ] PFX **de produção** enviado no painel Focus (CNPJ do emitente).
- [ ] Validade > 60 dias na data do go-live.
- [ ] CNPJ do certificado = CNPJ da empresa cadastrada na Focus.
- [ ] Confirmar no painel Focus: status "Ativo / Produção".
- [ ] Registro em `certificados_digitais` marcado como **legado/informativo** — o ERP **não transmite** com ele; serve só para monitorar vencimento.

### 1.2 Token Focus NFe (produção)
- [ ] Token **de produção** gerado no painel Focus (distinto do token de homologação).
- [ ] Secret `FOCUS_NFE_TOKEN` provisionado no backend (Lovable Cloud).
- [ ] Chamada de teste `GET /v2/empresas` autenticada retornando 200.
- [ ] Nenhum token em `.env`, código-fonte ou logs.

### 1.3 Empresa (tabela `empresa`)
- [ ] `provedor_nfe = 'focus_nfe'`
- [ ] `ambiente_nfe = 'producao'`
- [ ] `crt` correto (1 = Simples, 2 = SN Excesso, 3 = Regime Normal)
- [ ] `razao_social`, `nome_fantasia`, `cnpj`, `inscricao_estadual`
- [ ] Endereço completo: `logradouro`, `numero`, `bairro`, `cidade`, `uf`, `cep` (só dígitos)
- [ ] Regime tributário coerente com CSOSN/CST usados

### 1.4 Numeração (`nfe_sequencias`)
- [ ] Série de produção definida (ex.: 1) e diferente da homologação
- [ ] `proximo_numero` **zerado ou alinhado** com o último autorizado na Focus para a mesma série/CNPJ (evita rejeição 539 — duplicidade)
- [ ] Conferência cruzada com painel Focus (última NFe autorizada por série)

### 1.5 CFOP e Regras Tributárias
- [ ] `cfop` cadastrado para cada operação real (venda dentro/fora UF, industrialização, devolução, remessa, retorno)
- [ ] `regras_tributarias` revisadas por: CFOP × UF origem × UF destino × NCM × CRT
- [ ] `uf_icms` / `uf_aliquotas` conferidas para todos os estados de destino ativos
- [ ] `beneficios_fiscais` (se aplicável): base reduzida, ST, isenção, ProdEspec têxtil
- [ ] Simulador fiscal (`/fiscal/simulador`) executado em ≥ 5 cenários reais

### 1.6 Produtos (`products` / `articles`)
- [ ] Todos os SKUs comercializáveis com **NCM válido** (8 dígitos)
- [ ] Unidade comercial/tributável preenchida
- [ ] `origem` (0-8) definida
- [ ] CST/CSOSN default conforme CRT
- [ ] `cest` quando aplicável a ST
- [ ] Preço/valor unitário coerente (sem zeros)

### 1.7 Clientes (`customers`)
- [ ] CNPJ/CPF válido (dígito verificador)
- [ ] IE ou "ISENTO" preenchida; `indicador_ie` correto (1/2/9)
- [ ] Endereço completo + CEP válido
- [ ] E-mail válido para envio de DANFE/XML
- [ ] Consumidor final e indicador de presença coerentes

### 1.8 Backup XML / DANFE
- [ ] Focus retém XML autorizado e DANFE (padrão do provedor)
- [ ] Job/rotina no ERP para baixar e arquivar cópia local em bucket `fiscal/xml/{ano}/{mes}/`
- [ ] Retenção mínima: **5 anos** (exigência fiscal)
- [ ] Teste de restore validado

### 1.9 Logs e Auditoria
- [ ] `nfe_logs` gravando request/response/status/duração de todas as ações (emitir, consultar, cancelar, CC-e, inutilizar)
- [ ] `nfe_eventos` alimentado por cancelamento, CC-e e inutilização
- [ ] `audit_logs` capturando quem disparou cada ação (user_id)
- [ ] Alerta configurado para status `rejeitada` ou HTTP ≥ 500

### 1.10 Permissões (RLS)
- [ ] Emissão/cancelamento restritos a cargos: `fiscal`, `gerente`, `desenvolvedor`
- [ ] Leitura de `notas_fiscais` restrita a perfis autorizados
- [ ] `certificados_digitais`: apenas `gerente` / `desenvolvedor`
- [ ] Nenhuma policy `USING (true)` ativa em tabelas fiscais
- [ ] Revisão manual dos usuários com role `desenvolvedor` em produção

---

## 2. Testes Obrigatórios Antes do Corte

Executar em **homologação Focus** e revalidar em produção com **1 NF simbólica**:

| # | Cenário | Esperado |
|---|---|---|
| 1 | Emitir NFe venda dentro do estado | `autorizada`, chave 44 dígitos |
| 2 | Emitir NFe venda interestadual | ICMS partilha correto |
| 3 | Consultar por chave | status coerente |
| 4 | Cancelar dentro do prazo | evento `cancelamento` sucesso |
| 5 | Carta de correção (CC-e) | evento `cce` sucesso |
| 6 | Inutilizar faixa não usada | evento `inutilizacao` sucesso |
| 7 | Download XML e DANFE | arquivos válidos |
| 8 | Trigger `on_nfe_autorizada` | baixa estoque + gera CR + fecha OP |
| 9 | Reenvio duplicado (mesmo `ref`) | idempotente, sem duplicar |
| 10 | Rejeição intencional (NCM inválido) | `rejeitada` + mensagem clara |

---

## 3. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Numeração desalinhada com Focus | Média | Alto (rejeição 539) | Conferir `nfe_sequencias` × painel Focus antes do 1º envio |
| Token de homologação vazando em produção | Baixa | Alto | Secret único `FOCUS_NFE_TOKEN` por ambiente + revisão |
| Certificado A1 vencendo sem aviso | Média | Crítico | Cron semanal + badge no painel `/fiscal/certificados` |
| NCM incorreto em SKU novo | Alta | Médio | Bloqueio no cadastro: NCM obrigatório e validado |
| Cliente sem IE / IE inválida | Alta | Médio | Validação no cadastro + no pré-faturamento |
| Indisponibilidade Focus / SEFAZ | Baixa | Alto | Retry exponencial + fila de reenvio; contingência manual |
| Perda de XML autorizado | Baixa | Crítico (fiscal) | Backup diário + retenção 5 anos + teste de restore |
| Cancelamento fora do prazo (>24h) | Média | Médio | UI bloqueia após 24h e orienta CC-e ou devolução |
| Permissão excessiva em produção | Média | Alto | Revisão trimestral de `user_roles` |

---

## 4. Validações Já Concluídas

- ✅ Adapter Focus (`focus.adapter.ts`) cobrindo emitir / consultar / cancelar / CC-e / inutilizar
- ✅ Builder de payload (`nfe.builder.ts`) mapeando empresa + destinatário + itens
- ✅ Server functions (`nfe.functions.ts`) com `requireSupabaseAuth`
- ✅ Triggers automáticos: estoque, financeiro, OP, expedição, entrega
- ✅ Logs (`nfe_logs`) e eventos (`nfe_eventos`) gravando 100% das ações
- ✅ Arquitetura oficial ERP → FiscalService → Focus Adapter → Focus → SEFAZ
- ✅ Bridge SEFAZ / microserviço próprio **descartados** (não há dependência ativa)

---

## 5. Pendências Bloqueantes para GO-LIVE

1. **Provisionar `FOCUS_NFE_TOKEN` de produção** (hoje inexistente no ambiente).
2. **Subir PFX de produção no painel Focus** (não no ERP).
3. **Alinhar `nfe_sequencias.proximo_numero`** com a Focus por série.
4. **Trocar `empresa.ambiente_nfe` para `producao`** — última chave.
5. **Executar 1 NF simbólica** (item de baixo valor) e validar autorização + triggers.

---

## 6. Recomendação Final

**🟡 CONDICIONAL PARA GO-LIVE.**

O ERP está **tecnicamente pronto** — adapter, builder, triggers e auditoria validados em homologação. A entrada em produção depende exclusivamente das 5 pendências operacionais da Seção 5, todas de execução direta (não exigem código).

Após concluí-las, executar o **teste da NF simbólica** e, se autorizada, liberar o corte com **janela de acompanhamento assistido de 72h** (fiscal + TI de plantão). Manter homologação em paralelo por **7 dias** para comparação de totalizadores.

Sem checklist 100% ✅ e sem teste simbólico autorizado, **não liberar produção**.

---

### 📊 Relatório de Execução

**Padrão utilizado:** 🛡️ QUALITY GATE (Pré-produção)

**Sub-agentes ativados:**

- 🎨 **UI Architect** — ➖ Não necessário
- 🗄️ **Supabase Engineer** — ➖ Não necessário
- 🔍 **Code Auditor** — ✅ Executado (revisão do módulo fiscal)
- 🧪 **Testing Agent** — ✅ Executado (matriz de testes obrigatórios)
- 📈 **SEO Optimizer** — ➖ Não necessário
- 🚀 **Deploy Ops** — ✅ Executado (checklist de corte + riscos)
- 🔌 **API Integrator** — ✅ Executado (Focus NFe)

**Resumo:** Entregue o relatório de GO-LIVE consolidando checklist, testes, riscos e recomendação condicional para produção via Focus NFe.

**Arquivos modificados:** 1 (`docs/go-live-nfe-focus.md`)

**Próximos passos sugeridos:** provisionar `FOCUS_NFE_TOKEN` de produção, subir PFX no painel Focus, alinhar `nfe_sequencias`, virar `ambiente_nfe='producao'` e executar a NF simbólica.
