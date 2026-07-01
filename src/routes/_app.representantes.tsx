import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { UserCheck } from "lucide-react";
export const Route = createFileRoute("/_app/representantes")({ component: () => (
  <ModulePlaceholder
    title="Representantes Comerciais"
    description="Comissões, metas, carteira de clientes, desempenho e indicadores individuais."
    icon={<UserCheck className="h-7 w-7" />}
    features={["Comissão por faixa","Metas mensais","Carteira de clientes","Vendas realizadas","Ranking","DRE do representante"]}
  />
)});
