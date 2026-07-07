import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_app/rep-meta")({
  ssr: false,
  component: () => (
    <ModulePlaceholder
      title="Rep. Meta R$"
      description="Cadastro em construção — em breve disponível."
      features={["Listagem", "Cadastro", "Edição", "Exclusão (Desenvolvedor)"]}
    />
  ),
});
