import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { pedidos, formatBRL, type Pedido } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/vendas")({
  component: VendasPage,
});

const statusColor: Record<Pedido["status"], string> = {
  "Orçamento": "bg-muted text-muted-foreground",
  "Aprovado": "bg-info/15 text-info",
  "Separação": "bg-warning/20 text-warning-foreground",
  "Faturado": "bg-primary/15 text-primary",
  "Expedido": "bg-accent/25 text-accent-foreground",
  "Entregue": "bg-success/15 text-success",
};

const columns: Column<Pedido>[] = [
  { key: "id", header: "Pedido", className: "font-mono text-xs" },
  { key: "cliente", header: "Cliente", sortable: true },
  { key: "data", header: "Data", sortable: true },
  { key: "vendedor", header: "Vendedor" },
  { key: "valor", header: "Valor", className: "text-right tabular-nums", sortable: true, render: (r) => formatBRL(r.valor) },
  { key: "status", header: "Status", render: (r) => <Badge className={statusColor[r.status]}>{r.status}</Badge> },
];

function VendasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Orçamentos, pedidos, aprovação, separação, faturamento e expedição."
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />Novo pedido</Button>}
      />
      <DataTable data={pedidos} columns={columns} searchKeys={["id", "cliente", "vendedor"]} />
    </div>
  );
}
