import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Scissors } from "lucide-react";
export const Route = createFileRoute("/_app/faccoes")({ component: () => (
  <ModulePlaceholder
    title="Facções Terceirizadas"
    description="Envio de materiais, retorno de produção, controle de perdas, custos e prazos."
    icon={<Scissors className="h-7 w-7" />}
    features={["Cadastro de facções","Envio de material","Retorno de produção","Controle de perdas","Custo por peça","Produtividade","Prazos"]}
  />
)});
