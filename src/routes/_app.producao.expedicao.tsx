import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  listarFilaExpedicao,
  listarPedidosLiberados,
  criarExpedicao,
} from "@/services/producao/expedicao.functions";
import { ExpedicaoStatusBadge } from "@/components/producao/expedicao-status-badge";

export const Route = createFileRoute("/_app/producao/expedicao")({
  head: () => ({ meta: [{ title: "Expedição" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  component: ExpedicaoPage,
});

function ExpedicaoPage() {
  const listar = useServerFn(listarFilaExpedicao);
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");

  const fila = useQuery({
    queryKey: ["expedicao", "fila", status],
    queryFn: () => listar({ data: { status: status || undefined } }),
  });

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Expedição"
        description="Fila de pedidos liberados → separação, conferência, romaneio e entrega."
        actions={<NovaExpedicaoDialog onCreated={() => qc.invalidateQueries({ queryKey: ["expedicao"] })} />}
      />

      <div className="flex gap-2 items-center">
        <Select value={status || "all"} onValueChange={v => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="max-w-xs"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {["aguardando","em_separacao","separado","em_conferencia","conferido","expedido","em_transito","entregue","ocorrencia","devolvido"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>OP</TableHead>
              <TableHead>NF-e</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Volumes</TableHead>
              <TableHead>Rastreio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fila.isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">Carregando...</TableCell></TableRow>}
            {!fila.isLoading && (fila.data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma expedição no filtro atual.</TableCell></TableRow>
            )}
            {(fila.data ?? []).map((row) => {
              const r = row as unknown as {
                id: string; status: string; volumes: number | null; rastreio: string | null;
                pedidos?: { numero: string } | null;
                ordens_producao?: { numero: number } | null;
                notas_fiscais?: { numero: string; status_sefaz: string } | null;
              };
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.pedidos?.numero ?? "—"}</TableCell>
                  <TableCell className="font-mono">{r.ordens_producao ? `#${r.ordens_producao.numero}` : "—"}</TableCell>
                  <TableCell className="font-mono">
                    {r.notas_fiscais ? `${r.notas_fiscais.numero} (${r.notas_fiscais.status_sefaz})` : "—"}
                  </TableCell>
                  <TableCell><ExpedicaoStatusBadge status={r.status} /></TableCell>
                  <TableCell>{r.volumes ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.rastreio ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/producao/expedicao/$id" params={{ id: r.id }}>Abrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function NovaExpedicaoDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [pedidoId, setPedidoId] = useState<string>("");
  const listarPedidos = useServerFn(listarPedidosLiberados);
  const criar = useServerFn(criarExpedicao);

  const pedidos = useQuery({
    queryKey: ["expedicao", "pedidos-liberados"],
    queryFn: () => listarPedidos(),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () => criar({ data: { pedido_id: pedidoId } }),
    onSuccess: () => {
      toast.success("Expedição criada");
      setOpen(false);
      setPedidoId("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Nova expedição</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova expedição a partir de pedido</DialogTitle></DialogHeader>
        <Select value={pedidoId} onValueChange={setPedidoId}>
          <SelectTrigger><SelectValue placeholder="Selecionar pedido liberado..." /></SelectTrigger>
          <SelectContent>
            {(pedidos.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.numero} — {p.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!pedidoId || mut.isPending}>
            {mut.isPending ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
