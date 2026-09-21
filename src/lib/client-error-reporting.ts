export function reportClientError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;

  console.error("[ERP Digitale] erro no cliente", {
    error,
    route: window.location.pathname,
    ...context,
  });
}
