import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
export const Route = createFileRoute("/_app/producao/qualidade")({
  head: () => ({ meta: [{ title: "Controle de Qualidade" }] }),
  component: () => <ModulePlaceholder title="Qualidade" description="Fila de OPs aguardando inspeção — em construção (Etapa 3b)." />,
});
