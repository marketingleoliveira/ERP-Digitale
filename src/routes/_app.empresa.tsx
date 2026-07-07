import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_app/empresa")({
  ssr: false,
  component: () => (
    <ModulePlaceholder
      title="__TITLE__"
      description="Cadastro em construção — em breve disponível."
      features={["Listagem", "Cadastro", "Edição", "Exclusão (Desenvolvedor)"]}
    />
  ),
});
