import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/financeiro/fluxo-caixa")({
  ssr: false,
  head: () => ({ meta: [{ title: "Fluxo de Caixa" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

type Row = { data: string; classe: string; tipo: string; origem: string; valor: number; descricao: string | null };

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["fluxo-caixa"],
    queryFn: async () => {
      const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const ate = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      const { data, error } = await supabase.from("vw_fluxo_caixa" as never).select("*").gte("data", desde).lte("data", ate).order("data");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  if (isLoading || !data) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  const entradas = data.filter(r => r.tipo === "entrada").reduce((s, r) => s + Number(r.valor), 0);
  const saidas = data.filter(r => r.tipo === "saida").reduce((s, r) => s + Number(r.valor), 0);
  const saldo = entradas - saidas;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Entradas (-30d a +90d)</div><div className="text-2xl font-semibold text-emerald-600">{fmt(entradas)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Saídas</div><div className="text-2xl font-semibold text-red-600">{fmt(saidas)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Saldo</div><div className={`text-2xl font-semibold ${saldo>=0?"text-emerald-600":"text-destructive"}`}>{fmt(saldo)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Movimentos (realizado + previsto)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Classe</TableHead><TableHead>Tipo</TableHead><TableHead>Origem</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem movimentos.</TableCell></TableRow>}
              {data.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.data}</TableCell>
                  <TableCell><Badge variant={r.classe === "realizado" ? "default" : "secondary"}>{r.classe}</Badge></TableCell>
                  <TableCell>{r.tipo}</TableCell>
                  <TableCell>{r.origem}</TableCell>
                  <TableCell>{r.descricao ?? "—"}</TableCell>
                  <TableCell className={`text-right ${r.tipo==="entrada"?"text-emerald-600":"text-red-600"}`}>{fmt(Number(r.valor))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
