/**
 * Adapter Focus NFe — abstrai chamadas HTTP à API do provedor.
 * NUNCA importar do client. Só é usado dentro de server functions.
 */
export type FocusEnv = "homologacao" | "producao";

export type FocusConfig = {
  token: string;
  ambiente: FocusEnv;
};

function baseUrl(cfg: FocusConfig): string {
  return cfg.ambiente === "producao"
    ? "https://api.focusnfe.com.br"
    : "https://homologacao.focusnfe.com.br";
}

function authHeader(cfg: FocusConfig): string {
  return "Basic " + Buffer.from(`${cfg.token}:`).toString("base64");
}

export type FocusResponse<T = unknown> = {
  ok: boolean;
  status: number;
  body: T;
  durationMs: number;
};

async function request<T = unknown>(
  cfg: FocusConfig,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<FocusResponse<T>> {
  const start = Date.now();
  const res = await fetch(`${baseUrl(cfg)}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(cfg),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const parsed = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    body: parsed as T,
    durationMs: Date.now() - start,
  };
}

export const focusAdapter = {
  baseUrl,
  emitir: (cfg: FocusConfig, ref: string, payload: unknown) =>
    request(cfg, "POST", `/v2/nfe?ref=${encodeURIComponent(ref)}`, payload),
  consultar: (cfg: FocusConfig, ref: string) =>
    request(cfg, "GET", `/v2/nfe/${encodeURIComponent(ref)}`),
  cancelar: (cfg: FocusConfig, ref: string, justificativa: string) =>
    request(cfg, "DELETE", `/v2/nfe/${encodeURIComponent(ref)}`, { justificativa }),
  cartaCorrecao: (cfg: FocusConfig, ref: string, correcao: string) =>
    request(cfg, "POST", `/v2/nfe/${encodeURIComponent(ref)}/carta_correcao`, { correcao }),
  inutilizar: (cfg: FocusConfig, payload: {
    cnpj: string; serie: number; numero_inicial: number; numero_final: number;
    justificativa: string; ano: number;
  }) => request(cfg, "POST", `/v2/nfe/inutilizacao`, payload),
};
