import { createFileRoute } from "@tanstack/react-router";
import { PerfilForm } from "@/components/configuracoes/perfil-form";
import { User } from "lucide-react";

function ConfigPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold text-primary">Meu Perfil</h1>
      </div>
      
      <div className="mt-4">
        <PerfilForm />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/configuracoes")({ component: ConfigPage });
