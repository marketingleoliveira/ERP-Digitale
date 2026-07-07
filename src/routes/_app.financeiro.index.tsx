/**
 * Financeiro — Contas a Receber geradas automaticamente ao autorizar NF-e.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro — Contas a Receber" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Financeiro,
});

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n));

function Financeiro() {
  const { data, isLoading } = useQuery({
    queryKey: ["contas-receber"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_receber")
        .select("*")
        .order("vencimento", { ascending: true })
        .limit(200);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  if (isLoading || !data) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  const totais = data.reduce(
    (acc, r) => {
      acc.total += Number(r.valor);
      acc.pago += Number(r.valor_pago);
      if (r.status !== "pago" && r.status !== "cancelado")
        acc.pendente += Number(r.valor) - Number(r.valor_pago);
      return acc;
    },
    { total: 0, pago: 0, pendente: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financeiro — Contas a Receber</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total faturado</div><div className="text-2xl font-semibold">{fmtBRL(totais.total)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Recebido</div><div className="text-2xl font-semibold">{fmtBRL(totais.pago)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pendente</div><div className="text-2xl font-semibold">{fmtBRL(totais.pendente)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Títulos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum título — títulos surgem automaticamente após autorização de NF-e.</TableCell></TableRow>
              )}
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.descricao ?? "—"}</TableCell>
                  <TableCell>{r.vencimento ?? "—"}</TableCell>
                  <TableCell>{fmtBRL(Number(r.valor))}</TableCell>
                  <TableCell>{fmtBRL(Number(r.valor_pago))}</TableCell>
                  <TableCell><Badge variant={r.status === "pago" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
