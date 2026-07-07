# Auditoria Fiscal — Sistema Digitale Têxtil

## 1. O que JÁ existe (reutilizável)

**Banco (29 tabelas relevantes)**
- `empresa` — Emissor NF-e completo (CNPJ/IE/IM, regime, endereço, ambiente, provedor, série, próximo nº, certificado A1 nome/validade). ✅ Reaproveitar.
- `customers` — Clientes com **campos fiscais já presentes**: CRT, IE, SUFRAMA, endereço de entrega, tipo_cliente, flags (importador, transportadora, fornecedor), tabela de prazo/parcelas/intervalo. ✅ Reaproveitar; faltam poucos campos (indicador_ie, consumidor_final, indicador_presenca, contribuinte_icms).
- `products` — NCM, CEST, origem, unidade, preços já existem. Faltam: CFOP padrão, EAN, EAN trib., peso, IPI/ICMS/PIS/COFINS/CST/CSOSN, código benefício, unidade tributável.
- `notas_fiscais` (37 col) + `notas_fiscais_itens` (21 col) + `notas_fiscais_faturas` — Estrutura core NF já criada, incl. chave_acesso, protocolo, status_sefaz, xml_url, danfe_url, provedor_ref (migração 20260707185847).
- `cfop`, `impostos`, `uf_icms` — Tabelas fiscais auxiliares já criadas.
- `tinturarias` (categoria=Transportadora), `sales_reps`, `funcionarios`, `lotes`, `estoque` (fios/tecidos), `product_variants`.
- `user_roles` + `has_role()` + `is_admin_or_gerente()` — Permissões prontas.

**Backend**
- `src/lib/nfe.functions.ts` — Server function `emitirNFe` (adapter Focus NFe/PlugNotas) ✅.
- `src/lib/danfe.ts` — DANFE PDF via jsPDF ✅ (versão simples).
- `requireSupabaseAuth` middleware + `attachSupabaseAuth` bearer ✅.
- Storage buckets `estampas`, `artigos` (privados).

**Frontend**
- 8 rotas fiscais + `NotaFiscalList` component (CRUD + emissão + DANFE).
- Configurações → Empresa (form completo com abas).
- Padrão UI: shadcn, tokens semânticos, sidebar, TanStack Query.

## 2. O que FALTA (a criar)

**Camada de serviço (não existe)** — obrigatório para desacoplar regras fiscais dos componentes:
```text
src/services/fiscal/
├── fiscal.service.ts       fachada (emitir, cancelar, inutilizar, CC-e, consultar)
├── nfe.adapter.ts          Focus NFe (já parcial)
├── nfce.adapter.ts         NFC-e
├── nfse.adapter.ts         NFS-e (interface — municipal)
├── xml.repository.ts       storage supabase (bucket "nfe-xml")
├── danfe.generator.ts      DANFE completo (upgrade do atual)
└── events.repository.ts    log de eventos
```

**Tabelas ausentes** (5 novas + extensões):
- `nfe_eventos` — cancelamento, CC-e, inutilização, manifestação (nfe_id, tipo, protocolo, xml, motivo, data, user_id).
- `nfe_logs` — auditoria (nfe_id, acao, request, response, user_id, timestamp).
- `nfe_sequencias` — controle de numeração por série/modelo/ambiente (evita race condition).
- `empresa_filiais` — multi-CNPJ/filial (referencia empresa matriz).
- Extensão de `products`: CFOP padrão, EAN, EAN trib., peso_bruto, peso_liq, cst_icms, csosn, cst_ipi, aliq_ipi, cst_pis, aliq_pis, cst_cofins, aliq_cofins, cod_beneficio, unidade_tributavel.
- Extensão de `customers`: consumidor_final (bool), contribuinte_icms (int 1/2/9), indicador_ie (int 1/2/9), indicador_presenca (int 0-9), transportadora_preferencial_id (uuid).
- Extensão de `empresa`: crt (int), csc_id, csc_token (NFC-e), certificado_a1_path (storage).

**Storage bucket novo**: `fiscal` (privado) — XMLs, DANFEs, certificados A1.

**Eventos SEFAZ** (server functions em `nfe.functions.ts`):
- `cancelarNFe`, `emitirCCe`, `inutilizarFaixa`, `consultarStatus`, `manifestarDestinatario`, `baixarXml`.

**Integrações internas ausentes**:
- Baixa automática de estoque ao autorizar NF (usar tabela `lotes` / estoque).
- Geração de contas a receber/pagar no financeiro (⚠️ módulo financeiro **não existe** ainda — planejar).
- Conversão Pedido→NF-e (⚠️ módulo pedidos **não existe** — planejar).
- Envio de e-mail (Resend/Lovable Cloud) do XML+DANFE ao cliente.

**Dashboard Fiscal**: rota `/fiscal/dashboard` com cards (emitidas, canceladas, rejeitadas, faturamento, impostos), gráficos (recharts) e export CSV/PDF.

**Segurança/permissões**: reutilizar `user_cargos` + `cargos.permissoes`. Adicionar entries: `nfe.emitir`, `nfe.cancelar`, `nfe.inutilizar`, `nfe.dashboard`.

## 3. Conflitos identificados

1. **`notas_fiscais.emissor`** existe como `text` mas dados devem vir de `empresa`. Manter coluna como snapshot (razão social no momento da emissão) — evita alteração retroativa se empresa mudar dados.
2. **Numeração** — hoje `empresa.proximo_numero_nfe` é editável manualmente. Substituir por função SQL `proximo_numero_nfe(serie, modelo)` atômica com `FOR UPDATE`.
3. **`products.ncm`** já existe — reutilizar; NÃO criar `products_fiscal` separado. Apenas ALTER TABLE.

## 4. Plano de implementação (incremental — 6 etapas)

**Etapa 1 — Dados & Segurança** _(1 migração)_
- Extend `products`, `customers`, `empresa` com campos fiscais faltantes.
- Cria `nfe_eventos`, `nfe_logs`, `nfe_sequencias`, `empresa_filiais`.
- Função `proximo_numero_nfe()` atômica.
- Bucket `fiscal` + policies (admin/gerente only).
- Permissões novas em `cargos.permissoes`.

**Etapa 2 — Fiscal Service Layer**
- Refatora `nfe.functions.ts` em `src/services/fiscal/` (fachada + adapters).
- Zod schemas para input/output SEFAZ.
- Logs estruturados gravando em `nfe_logs`.

**Etapa 3 — Eventos SEFAZ**
- Server functions: cancelar, CC-e, inutilizar, consultar, manifestar.
- UI de eventos no `NotaFiscalList` (drawer por nota com histórico).

**Etapa 4 — Automações internas**
- Trigger: NF autorizada → baixa estoque em `lotes`.
- Enviar e-mail (Lovable AI Gateway → Resend) com XML+PDF.
- Preparar hooks p/ futuro módulo Financeiro (interface `IFinanceiroAdapter`).

**Etapa 5 — Cadastros fiscais nos formulários existentes**
- Aba "Fiscal" no form de Produtos (`/produtos`).
- Aba "Fiscal" no form de Clientes (`/empresa`).
- Aba "Certificado + CSC" em Configurações → Empresa.

**Etapa 6 — Dashboard Fiscal + NFC-e + export**
- `/fiscal/dashboard` com KPIs, gráficos, filtros.
- Export CSV/PDF (jsPDF + papaparse).
- NFC-e adapter (venda ao consumidor).
- NFS-e: apenas interface + placeholder.

## 5. Impacto no banco

| Ação | Tabelas | Risco |
|---|---|---|
| ALTER (add col nullable) | products, customers, empresa | Baixo — não quebra queries existentes |
| CREATE | nfe_eventos, nfe_logs, nfe_sequencias, empresa_filiais | Nulo — tabelas novas |
| Função + trigger | proximo_numero_nfe, baixa_estoque_nf | Médio — testar em homologação |

Zero DROP. Zero renomeação. Zero perda de dados.

## 6. Requisitos externos do usuário

Antes das etapas 2+ precisamos que você:
1. Escolha o provedor SEFAZ (Focus NFe recomendado).
2. Crie conta no provedor + envie certificado A1 no painel deles.
3. Autorize eu adicionar o secret `FOCUS_NFE_TOKEN`.
4. (NFC-e) Solicite CSC no portal SEFAZ do seu estado.

## 7. Fora de escopo neste plano

- Módulo **Financeiro** (contas a receber/pagar) — não existe no ERP; será feature separada.
- Módulo **Pedidos de venda** — não existe; será feature separada.
- CT-e e MDF-e — arquitetura preparada mas implementação futura.

---

**Aprove este plano para eu executar a Etapa 1** (migração de extensão do schema + service layer inicial), ou peça ajustes.
