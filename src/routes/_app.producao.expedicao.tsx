import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_app/producao/expedicao")({
  head: () => ({ meta: [{ title: "Expedição" }] }),
  component: () => <ModulePlaceholder title="Expedição" description="Fila de OPs faturadas para expedição — em construção (Etapa 3b)." features={[]} />,
});
