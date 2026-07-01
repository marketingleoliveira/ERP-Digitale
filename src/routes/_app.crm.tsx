import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Handshake } from "lucide-react";
export const Route = createFileRoute("/_app/crm")({ component: () => (
  <ModulePlaceholder
    title="CRM"
    description="Contatos, negociações, propostas, follow-up, agenda e funil de vendas."
    icon={<Handshake className="h-7 w-7" />}
    features={["Contatos e leads","Funil de vendas","Propostas comerciais","Tarefas e follow-up","Agenda","Integração WhatsApp (futuro)"]}
  />
)});
