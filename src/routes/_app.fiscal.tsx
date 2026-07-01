import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { FileText } from "lucide-react";
export const Route = createFileRoute("/_app/fiscal")({ component: () => (
  <ModulePlaceholder
    title="Fiscal"
    description="Estrutura preparada para NF-e, NFC-e e demais documentos fiscais."
    icon={<FileText className="h-7 w-7" />}
    features={["NF-e (integração futura)","NFC-e","CFOPs / NCM","Regras fiscais por operação","SPED","Manifesto do destinatário"]}
  />
)});
