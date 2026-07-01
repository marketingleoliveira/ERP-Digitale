import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { produtos, formatBRL, formatInt, type Produto } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/produtos")({
  component: ProdutosPage,
});

const columns: Column<Produto>[] = [
  { key: "sku", header: "SKU", className: "font-mono text-xs" },
  { key: "nome", header: "Produto", sortable: true, render: (r) => (
    <div>
      <p className="font-medium">{r.nome}</p>
      <p className="text-xs text-muted-foreground">{r.composicao} • {r.gramatura} • {r.largura}</p>
    </div>
  )},
  { key: "categoria", header: "Categoria", render: (r) => <Badge variant="outline">{r.categoria}</Badge> },
  { key: "colecao", header: "Coleção" },
  { key: "estoque", header: "Estoque", className: "text-right tabular-nums", render: (r) => formatInt(r.estoque) },
  { key: "preco", header: "Preço", className: "text-right tabular-nums", render: (r) => formatBRL(r.preco) },
  { key: "status", header: "Status", render: (r) => (
    <Badge className={r.status === "Ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>{r.status}</Badge>
  )},
];

function ProdutosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Tecidos, estampas, modelos, matérias-primas, aviamentos, acabados e semiacabados."
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />Novo produto</Button>}
      />
      <DataTable data={produtos} columns={columns} searchKeys={["sku", "nome", "categoria", "colecao"]} />
    </div>
  );
}
