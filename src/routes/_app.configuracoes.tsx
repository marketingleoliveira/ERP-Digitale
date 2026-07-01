import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Settings } from "lucide-react";
export const Route = createFileRoute("/_app/configuracoes")({ component: () => (
  <ModulePlaceholder
    title="Configurações"
    description="Parametrização do sistema sem necessidade de programação."
    icon={<Settings className="h-7 w-7" />}
    features={["Dados da empresa","Numeração de documentos","Regras de negócio","Notificações","Integrações (marketplaces, WhatsApp, transportadoras, pagamentos)","Backup e importações"]}
  />
)});
