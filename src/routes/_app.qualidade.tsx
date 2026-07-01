import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { BadgeCheck } from "lucide-react";
export const Route = createFileRoute("/_app/qualidade")({ component: () => (
  <ModulePlaceholder
    title="Qualidade"
    description="Inspeções, não conformidades, aprovação/rejeição e indicadores de qualidade."
    icon={<BadgeCheck className="h-7 w-7" />}
    features={["Plano de inspeção","Não conformidades","Aprovação/rejeição","Rastreio de defeitos","Indicadores (FTQ, PPM)","Ações corretivas"]}
  />
)});
