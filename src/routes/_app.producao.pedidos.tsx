import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_app/producao/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos de Venda" }] }),
  component: () => <ModulePlaceholder title="Pedidos" description="Cadastro de pedidos de venda — em construção (Etapa 3a)." />,
});
