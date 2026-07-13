import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PedidoStatusBadge } from "@/components/producao/pedido-status-badge";
import { PedidoFormDialog } from "@/components/producao/pedido-form-dialog";
import { listarPedidos } from "@/services/producao/pedido.functions";

export const Route = createFileRoute("/_app/producao/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos de Venda" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  component: PedidosList,
});

const STATUS_FILTROS = [
  { v: "", label: "Todos" },
  { v: "rascunho", label: "Rascunho" },
  { v: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { v: "aprovado", label: "Aprovado" },
  { v: "confirmado", label: "Confirmado" },
  { v: "em_producao", label: "Em produção" },
  { v: "faturado", label: "Faturado" },
  { v: "expedido", label: "Expedido" },
  { v: "cancelado", label: "Cancelado" },
];

function PedidosList() {
  const listar = useServerFn(listarPedidos);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["pedidos-list", status, search],
    queryFn: () => listar({ data: { status: status || undefined, search: search || undefined } }),
  });

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Pedidos de Venda"
        description="Ciclo completo: rascunho → produção → faturamento → expedição."
        actions={<PedidoFormDialog />}
      />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por número..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTROS.map(s => <SelectItem key={s.v || "all"} value={s.v || "__all__"}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Representante</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Produção</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum pedido encontrado.
              </TableCell></TableRow>
            ) : data.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link to="/producao/pedidos/$id" params={{ id: p.id }} className="font-mono font-semibold hover:underline">
                    {p.numero}
                  </Link>
                </TableCell>
                <TableCell>{p.cliente}</TableCell>
                <TableCell className="text-muted-foreground">{p.vendedor}</TableCell>
                <TableCell>{p.data_pedido ? new Date(p.data_pedido).toLocaleDateString("pt-BR") : "-"}</TableCell>
                <TableCell>{p.prazo_entrega ? new Date(p.prazo_entrega).toLocaleDateString("pt-BR") : "-"}</TableCell>
                <TableCell className="text-right font-mono">
                  {p.valor_total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
                </TableCell>
                <TableCell><PedidoStatusBadge status={p.status} /></TableCell>
                <TableCell>
                  {p.producao.total === 0
                    ? <Badge variant="outline" className="text-muted-foreground">Sem OP</Badge>
                    : <Badge variant="outline">{p.producao.concluidas}/{p.producao.total} OPs</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
