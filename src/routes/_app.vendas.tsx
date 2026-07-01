import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_app/vendas")({ component: VendasPage });

function VendasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Orçamentos, pedidos, aprovação, separação, faturamento e expedição."
      />
      <EmptyState
        icon={<Receipt className="h-5 w-5" />}
        title="Módulo de Vendas em preparação"
        description="Este módulo será liberado após a conclusão dos Cadastros (Clientes, Produtos e Representantes)."
      />
    </div>
  );
}
