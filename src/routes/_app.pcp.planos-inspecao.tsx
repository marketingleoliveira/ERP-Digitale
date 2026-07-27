import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pcp/planos-inspecao")({
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Planos de Inspeção</h1>
      <p className="text-muted-foreground">Em breve: configuração de características por artigo.</p>
    </div>
  ),
});
