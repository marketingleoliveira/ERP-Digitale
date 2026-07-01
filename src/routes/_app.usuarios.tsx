import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { ShieldCheck } from "lucide-react";
export const Route = createFileRoute("/_app/usuarios")({ component: () => (
  <ModulePlaceholder
    title="Usuários & Permissões"
    description="Perfis, permissões granulares, auditoria completa e histórico de alterações."
    icon={<ShieldCheck className="h-7 w-7" />}
    features={["Perfis (admin, gerente, vendedor, produção…)","Permissões por módulo","Auditoria de ações","Histórico de alterações","2FA (futuro)"]}
  />
)});
