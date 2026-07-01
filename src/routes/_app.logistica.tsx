import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { PackageCheck } from "lucide-react";
export const Route = createFileRoute("/_app/logistica")({ component: () => (
  <ModulePlaceholder
    title="Logística"
    description="Separação, conferência, embalagem, expedição, romaneio e rastreamento."
    icon={<PackageCheck className="h-7 w-7" />}
    features={["Separação","Conferência","Embalagem","Romaneio","Transportadoras","Rastreamento","Comprovante de entrega"]}
  />
)});
