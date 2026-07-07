import { createFileRoute } from "@tanstack/react-router";
import { NotaFiscalList } from "@/components/fiscal/nota-fiscal-list";

export const Route = createFileRoute("/_app/fiscal/nota-fiscal-importacao")({
  ssr: false,
  component: () => <NotaFiscalList tipo="importacao" title="Nota Fiscal Importação" emoji="🌎" />,
});
