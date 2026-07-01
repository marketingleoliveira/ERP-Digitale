import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { clientes, formatBRL, type Cliente } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/clientes")({
  component: ClientesPage,
});

const columns: Column<Cliente>[] = [
  { key: "id", header: "Código", sortable: true, className: "font-mono text-xs" },
  { key: "nome", header: "Nome / Razão Social", sortable: true, render: (r) => (
    <div>
      <p className="font-medium">{r.nome}</p>
      <p className="text-xs text-muted-foreground">{r.documento}</p>
    </div>
  )},
  { key: "tipo", header: "Tipo", render: (r) => <Badge variant="outline">{r.tipo}</Badge> },
  { key: "cidade", header: "Cidade", render: (r) => `${r.cidade}/${r.uf}` },
  { key: "segmento", header: "Segmento", sortable: true },
  { key: "vendedor", header: "Vendedor" },
  { key: "limite", header: "Limite crédito", className: "text-right", render: (r) => formatBRL(r.limite) },
  { key: "status", header: "Status", render: (r) => (
    <Badge className={
      r.status === "Ativo" ? "bg-success/15 text-success hover:bg-success/20" :
      r.status === "Bloqueado" ? "bg-destructive/15 text-destructive hover:bg-destructive/20" :
      "bg-muted text-muted-foreground"
    }>{r.status}</Badge>
  )},
];

function ClientesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Pessoas físicas e jurídicas, com múltiplos endereços, contatos e histórico."
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />Novo cliente</Button>}
      />
      <DataTable data={clientes} columns={columns} searchKeys={["nome", "documento", "cidade", "segmento", "vendedor"]} />
    </div>
  );
}
