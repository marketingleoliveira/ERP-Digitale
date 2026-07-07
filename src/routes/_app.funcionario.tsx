import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { IdCard } from "lucide-react";
export const Route = createFileRoute("/_app/funcionario")({ component: () => (
  <ModulePlaceholder
    title="Funcionário"
    description="Cadastro e gestão de funcionários da empresa."
    icon={<IdCard className="h-7 w-7" />}
    features={["Dados pessoais","Dados profissionais","Cargo e departamento","Histórico funcional","Documentos"]}
  />
)});
