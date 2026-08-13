import { createFileRoute } from "@tanstack/react-router";
import { NotaFiscalList } from "@/components/fiscal/nota-fiscal-list";
import { z } from "zod";

/**
 * Valida search params para a rota de notas fiscais.
 * Suporta ?nf=<id> para abrir uma NF-e diretamente no dialog de edição.
 * 
 * Exemplo de uso:
 * - /fiscal/nota-fiscal — lista todas as NFs
 * - /fiscal/nota-fiscal?nf=abc123 — abre a NF-e com ID abc123 no dialog
 */
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
