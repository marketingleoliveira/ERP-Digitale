import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { KeyRound } from "lucide-react";
export const Route = createFileRoute("/_app/senha")({ component: () => (
  <ModulePlaceholder
    title="Senha"
    description="Alteração e gestão de senhas de acesso."
    icon={<KeyRound className="h-7 w-7" />}
    features={["Alterar senha","Política de senhas","Recuperação","Histórico de alterações"]}
  />
)});
