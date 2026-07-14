import { createFileRoute } from "@tanstack/react-router";
import { NotaFiscalList } from "@/components/fiscal/nota-fiscal-list";

export const Route = createFileRoute("/_app/fiscal/r-nota-fiscal")({
  ssr: false,
  component: () => <NotaFiscalList tipo="entrada" title="R. Nota Fiscal (Entrada)" emoji="📥" />,
});
