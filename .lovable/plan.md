
# FASE 1 REVISADA — Motor Fiscal Direto SEFAZ (A1)

## AVISO CRÍTICO — LEIA ANTES DE APROVAR

O runtime deste projeto é **Cloudflare Workers** (edge). SEFAZ NFe exige duas coisas que o Workers **não suporta nativamente**:

1. **mTLS de saída** (fetch com certificado cliente) — Workers não expõe API para anexar cert/chave PFX em chamadas `fetch()` para os webservices SEFAZ. SEFAZ exige mTLS obrigatório em todos os endpoints (NfeAutorizacao4, NfeConsultaProtocolo4, RecepcaoEvento4, NfeInutilizacao4).
2. **SOAP/XML-DSig com PFX** — bibliotecas maduras (`node-forge`, `xml-crypto`, `xmldsigjs`) rodam parcialmente, mas assinatura enveloped RSA-SHA1 com certificado extraído de PFX depende de operações que o WebCrypto do Workers restringe (importKey PKCS12).

**Conclusão honesta:** transmitir direto para SEFAZ **de dentro do Worker é inviável hoje**. Precisamos de um pequeno serviço externo que faça a ponte assinada.

## Opções arquiteturais reais

| Opção | Custo/mês | Complexidade | Recomendação |
|---|---|---|---|
| **A) Microserviço Node.js self-hosted** (VPS Hetzner/Contabo €4-5, Node + node-forge + xml-crypto + soap) | ~R$25/mês | Média | ✅ **Recomendada** — atende ao objetivo "custo próximo de zero" |
| B) Cloudflare Container (beta) rodando Node | ~US$5/mês | Média-alta | Alternativa se preferir tudo na Cloudflare |
| C) Voltar para Focus NFe / eNotas | R$0,08-0,15/NFe | Baixa | Rejeitada pelo usuário |
| D) Reescrever runtime do ERP (sair do Workers) | Alto | Muito alta | Não recomendada |

**Plano abaixo assume Opção A.**

## 1. Componentes reaproveitados (preservados 100%)

- `nfe.builder.ts` — construção de payload (será adaptado para gerar XML nfeProc em vez de JSON Focus)
- `nfe_logs`, `nfe_eventos`, `nfe_sequencias`, `notas_fiscais`, `notas_fiscais_itens`
- `FiscalService` (`src/lib/nfe.functions.ts`) — assinaturas de server fns e contratos mantidos
- Pré-faturamento (`pre-faturamento.functions.ts`)
- Triggers: `on_nfe_autorizada`, `on_nfe_autorizada_op`, `on_nfe_autorizada_financeiro`
- Bucket `fiscal` (storage)
- Dashboard fiscal, integrações OP/estoque/financeiro

## 2. Componentes removidos

- `src/services/fiscal/focus.adapter.ts` (deletado)
- Secret `FOCUS_NFE_TOKEN` (não usado)
- Campos `provedor_nfe`, `provedor_ref` deixam de ser usados (mantidos para histórico)

## 3. Componentes novos

**No ERP (Worker):**
- `src/services/fiscal/sefaz.adapter.ts` — cliente HTTP do microserviço (fetch com HMAC)
- `src/services/fiscal/certificado.functions.ts` — server fns: upload PFX, listar, marcar ativo, alerta vencimento
- `src/components/fiscal/certificado-a1-upload.tsx` — UI upload
- `src/routes/_app.fiscal.certificados.tsx` — página gestão

**Microserviço externo (`sefaz-bridge/`):**
- Node 20 + Express + `node-forge` + `xml-crypto` + `strong-soap` + `pdfkit`
- Endpoints: `POST /nfe/emitir`, `/nfe/consultar`, `/nfe/cancelar`, `/nfe/cce`, `/nfe/inutilizar`, `/danfe/gerar`
- Autenticação: HMAC-SHA256 compartilhado (`SEFAZ_BRIDGE_SECRET`)
- Carrega PFX vindo do ERP (base64 + senha), assina XML, transmite SEFAZ, retorna XML autorizado
- Dockerfile pronto para VPS (Hetzner/Contabo/Oracle Free Tier)

## 4. Bibliotecas recomendadas

**Microserviço:**
- `node-forge` — parse PFX, extrair chave/cert
- `xml-crypto` — assinatura XMLDSig enveloped
- `xml2js` / `fast-xml-parser` — parse/serialize XML
- `strong-soap` ou `axios` + envelope manual — SOAP SEFAZ
- `pdfkit` + `bwip-js` — DANFE PDF + código de barras
- `xsd-schema-validator` (opcional) — validação XSD antes de enviar

**ERP:** nada novo — só `fetch` nativo + HMAC via WebCrypto.

## 5. Alterações no banco

Migration única:

```sql
CREATE TABLE public.certificados_digitais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresa(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text NOT NULL,
  pfx_storage_path text NOT NULL,   -- fiscal/certificados/{id}.pfx
  senha_cifrada text NOT NULL,      -- AES-GCM com CERT_ENC_KEY
  senha_iv text NOT NULL,
  valido_de timestamptz NOT NULL,
  valido_ate timestamptz NOT NULL,
  ativo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificados_digitais TO authenticated;
GRANT ALL ON public.certificados_digitais TO service_role;
ALTER TABLE public.certificados_digitais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert admin" ON public.certificados_digitais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'))
  WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'gerente'));

ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS xml_storage_path text,
  ADD COLUMN IF NOT EXISTS danfe_storage_path text,
  ADD COLUMN IF NOT EXISTS ambiente text CHECK (ambiente IN ('homologacao','producao'));
```

Bucket `fiscal` já existe (privado). Novos prefixos: `certificados/`, `xml/{chave}.xml`, `pdf/{chave}.pdf`.

## 6. Alterações no backend (ERP)

- `nfe.builder.ts`: adicionar `buildNfeXml(nota, itens, empresa, dest)` retornando XML string (schema PL_010). Focus payload builder é removido.
- `nfe.functions.ts`: `emitir/cancelar/cce/consultar/inutilizar` chamam `sefazAdapter.*` em vez de `focusAdapter.*`. Assinaturas de entrada/saída preservadas — nenhuma tela React muda.
- `sefaz.adapter.ts` (novo): `fetch(${SEFAZ_BRIDGE_URL}/nfe/emitir, { headers HMAC, body: {xml, certId} })`.
- Após autorização: baixar XML+PDF do bridge, salvar em `storage.fiscal/xml/{chave}.xml` e `pdf/{chave}.pdf` via `supabaseAdmin` (dentro do handler).

## 7. Alterações no frontend

- Nova rota `/fiscal/certificados` — upload PFX (drag&drop), senha, listar validade, badge vencimento < 30 dias.
- Menu fiscal ganha item "Certificados Digitais".
- Componente `NfeAcoesMenu` já existente continua chamando os mesmos server fns (contrato preservado).

## 8. Secrets necessários

- `SEFAZ_BRIDGE_URL` — URL do microserviço (ex.: `https://sefaz.digitaletextil.com.br`)
- `SEFAZ_BRIDGE_HMAC_SECRET` — segredo compartilhado (gerado)
- `CERT_ENC_KEY` — chave AES-256 para cifrar senha do PFX no banco (gerado)

## 9. Riscos técnicos

| Risco | Severidade | Mitigação |
|---|---|---|
| Precisar de VPS externa | Alta | Aceito pelo usuário; Hetzner CX11 €4/mês |
| SEFAZ muda schema (PL_010→PL_011) | Média | Versionar `nfe.builder.ts`; monitorar Portal NFe |
| Certificado A1 expira | Alta | Alerta 30/15/7 dias por email + banner |
| Bridge cai → ERP não emite | Alta | Systemd + healthcheck + fallback manual |
| Senha PFX vazar | Crítica | AES-GCM no banco, chave em secret Worker, nunca logar |
| Assinatura XML inválida (namespaces) | Alta | Suite de testes com XMLs de referência SEFAZ |
| Rate limit SEFAZ | Baixa | Retry exponencial no bridge |

## 10. Complexidade e manutenção

- **Complexidade inicial:** ALTA (SOAP SEFAZ, XMLDSig, XSD, DANFE — 3-5 semanas de dev experiente)
- **Manutenção anual estimada:** 20-40h/ano (atualizações de schema NFe, renovação certificado, correções SEFAZ)
- **Custo operacional:** ~R$25/mês (VPS) vs R$0,08-0,15/NFe do Focus. Break-even: ~200 NFe/mês.

## Plano de execução (fases)

```text
FASE 1a — Infra e certificado (esta entrega)
  1. Migration certificados_digitais + colunas notas_fiscais
  2. Server fns upload/list/ativar certificado
  3. UI /fiscal/certificados
  4. Secrets CERT_ENC_KEY, SEFAZ_BRIDGE_URL, SEFAZ_BRIDGE_HMAC_SECRET

FASE 1b — Microserviço bridge (repositório separado)
  5. Scaffold Node 20 + Express + node-forge + xml-crypto
  6. Endpoints emitir/consultar/cancelar/cce/inutilizar
  7. Geração DANFE PDF
  8. Dockerfile + docs deploy VPS

FASE 1c — Substituir adapter no ERP
  9. sefaz.adapter.ts + nfe.builder.ts (XML) + refatorar nfe.functions.ts
  10. Deletar focus.adapter.ts
  11. Persistir XML/DANFE em storage.fiscal
  12. Testes E2E homologação (T1-T12 do plano anterior)
```

## Decisões que preciso confirmar antes de começar

1. **Aceita rodar um microserviço externo (Opção A, ~R$25/mês)?** Se não, precisamos revisar a estratégia — não há caminho puramente Worker/edge para SEFAZ direto hoje.
2. **Quem hospedará o bridge?** (VPS que você contrata / Oracle Cloud Free Tier / posso te entregar o Dockerfile + instruções).
3. **Autoriza começar pela FASE 1a** (certificado + UI + migration) enquanto o bridge é desenvolvido em paralelo? Isso destrava a UI sem quebrar o fluxo atual (Focus continua funcionando até o cutover).
4. **Certificado A1 disponível para upload em homologação?** Precisa ser um PFX válido (mesmo que expirado serve para dev).
