import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Clock } from "lucide-react";
export const Route = createFileRoute("/_app/time-log")({ component: () => (
  <ModulePlaceholder
    title="Time Log"
    description="Registro de logs e auditoria de tempo de operações do sistema."
    icon={<Clock className="h-7 w-7" />}
    features={["Log de acessos","Log de operações","Auditoria por usuário","Exportação de logs","Filtros por período"]}
  />
)});
