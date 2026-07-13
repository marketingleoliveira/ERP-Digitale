# Contrato futuro — Rastreamento de transportadora

**Status:** documentado; **NÃO** implementado nesta sprint.

## Escopo

Integração com APIs de transportadoras (Correios/Jadlog/Braspress/etc.) para atualizar automaticamente `entrega_eventos` com posição, previsão e comprovante digital.

## Contrato mínimo esperado

```ts
interface TrackingProvider {
  id: "correios" | "jadlog" | "braspress" | string;
  consultar(codigo: string): Promise<TrackingEvent[]>;
}

interface TrackingEvent {
  data: string;           // ISO
  local: string | null;
  status: "postado" | "em_transito" | "saiu_para_entrega" | "entregue" | "ocorrencia";
  descricao: string;
  hash?: string;          // idempotência: evita reinsert
}
```

## Persistência

- Novo campo em `romaneios`: `codigo_rastreio text`.
- Cada `TrackingEvent` vira uma linha em `entrega_eventos` com deduplicação por `(romaneio_id, hash)`.
- Job (cron / pg_cron) chama o provider a cada N minutos para romaneios em `em_transito`.

## Segurança

- Tokens dos providers em secrets do Lovable Cloud (nunca no frontend).
- Server function `atualizarRastreioRomaneio(romaneioId)` chama o provider via edge/server.
- Nenhum PII do destinatário exposto no log.
