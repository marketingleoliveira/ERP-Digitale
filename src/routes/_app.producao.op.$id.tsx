import { createFileRoute, useParams } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_app/producao/op/$id")({
  head: () => ({ meta: [{ title: "Detalhe da OP" }] }),
  component: OpDetail,
});

function OpDetail() {
  const { id } = useParams({ from: "/_app/producao/op/$id" });
  return <ModulePlaceholder title={`OP ${id.slice(0, 8)}`} description="Detalhe da OP — timeline, apontamentos, consumos, qualidade e ações de transição em construção (Etapa 3a)." />;
}
