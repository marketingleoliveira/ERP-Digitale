import { createFileRoute } from "@tanstack/react-router";
import { NotaFiscalList } from "@/components/fiscal/nota-fiscal-list";
import { z } from "zod";

const notaFiscalSearchSchema = z.object({
  nf: z.string().optional(),
});

export const Route = createFileRoute("/_app/fiscal/nota-fiscal")({
  ssr: false,
  validateSearch: (search) => notaFiscalSearchSchema.parse(search),
  component: () => {
    const search = Route.useSearch();
    return <NotaFiscalList tipo="saida" title="Nota Fiscal" emoji="📤" initialEditingId={search.nf} />;
  },
});
