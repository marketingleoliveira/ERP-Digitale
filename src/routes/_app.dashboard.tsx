import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação. Os indicadores serão preenchidos automaticamente conforme os dados forem cadastrados."
      />
      <EmptyState
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Sem dados para exibir ainda"
        description="Comece cadastrando Clientes, Fornecedores, Representantes e Produtos. Assim que houver movimentação, os indicadores aparecerão aqui."
      />
    </div>
  );
}
