import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Wallet } from "lucide-react";
export const Route = createFileRoute("/_app/financeiro")({ component: () => (
  <ModulePlaceholder
    title="Financeiro"
    description="Contas a pagar/receber, fluxo de caixa, DRE, conciliação, boletos e projeções."
    icon={<Wallet className="h-7 w-7" />}
    features={["Contas a pagar","Contas a receber","Fluxo de caixa","Conciliação bancária","Centros de custo","Plano de contas","DRE e balancetes","Emissão de boletos"]}
  />
)});
