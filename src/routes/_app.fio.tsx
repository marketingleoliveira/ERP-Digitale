import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_app/fio")({
  ssr: false,
  component: () => (
    <ModulePlaceholder
      title="Fio"
      description="Cadastro em construção — em breve disponível."
      features={["Listagem", "Cadastro", "Edição", "Exclusão (Desenvolvedor)"]}
    />
  ),
});
