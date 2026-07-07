import { createFileRoute } from "@tanstack/react-router";
import { NotaFiscalList } from "@/components/fiscal/nota-fiscal-list";

export const Route = createFileRoute("/_app/fiscal/nota-fiscal")({
  ssr: false,
  component: () => <NotaFiscalList tipo="saida" title="Nota Fiscal" emoji="📤" />,
});
