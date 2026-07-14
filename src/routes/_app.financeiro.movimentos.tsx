import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/financeiro/movimentos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Movimentos Financeiros" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["movimentos-financeiros"],
    queryFn: async () => {
      const { data, error } = await supabase.from("movimentos_financeiros").select("*").order("data", { ascending: false }).limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || !data) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Movimentos Financeiros</h1>
      <Card>
        <CardHeader><CardTitle>Últimos 300 lançamentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Origem</TableHead><TableHead>Forma</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Conciliado</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem lançamentos.</TableCell></TableRow>}
              {data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.data}</TableCell>
                  <TableCell><Badge variant={m.tipo === "entrada" ? "default" : "secondary"}>{m.tipo}</Badge></TableCell>
                  <TableCell>{m.origem}</TableCell>
                  <TableCell>{m.forma_pagamento ?? "—"}</TableCell>
                  <TableCell>{m.descricao ?? "—"}</TableCell>
                  <TableCell className={`text-right ${m.tipo==="entrada"?"text-emerald-600":"text-red-600"}`}>{fmt(Number(m.valor))}</TableCell>
                  <TableCell>{m.conciliado ? "✓" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
