import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmpresaForm } from "@/components/configuracoes/empresa-form";
import { PerfilForm } from "@/components/configuracoes/perfil-form";
import { Settings, User } from "lucide-react";

function ConfigPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold text-primary">Configurações</h1>
      </div>
      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="numeracao" disabled>Numeração</TabsTrigger>
          <TabsTrigger value="integracoes" disabled>Integrações</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil" className="mt-4">
          <PerfilForm />
        </TabsContent>
        <TabsContent value="empresa" className="mt-4">
          <EmpresaForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute("/_app/configuracoes")({ component: ConfigPage });
