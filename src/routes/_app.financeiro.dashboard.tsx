import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/financeiro/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard Financeiro" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Dashboard,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["fin-dashboard"],
    queryFn: async () => {
      const [cp, cr, mov] = await Promise.all([
        supabase.from("contas_pagar").select("valor,status,vencimento"),
        supabase.from("contas_receber").select("valor,valor_pago,status,vencimento"),
        supabase.from("movimentos_financeiros").select("tipo,valor,data").gte("data", new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)),
      ]);
      if (cp.error) throw cp.error; if (cr.error) throw cr.error; if (mov.error) throw mov.error;
      return { cp: cp.data ?? [], cr: cr.data ?? [], mov: mov.data ?? [] };
    },
  });

  if (isLoading || !data) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  const hoje = new Date().toISOString().slice(0, 10);
  const aPagar = data.cp.filter(r => r.status === "aberta").reduce((s, r) => s + Number(r.valor), 0);
  const vencidas = data.cp.filter(r => r.status === "aberta" && r.vencimento < hoje).reduce((s, r) => s + Number(r.valor), 0);
  const aReceber = data.cr.filter(r => r.status !== "pago" && r.status !== "cancelado").reduce((s, r) => s + (Number(r.valor) - Number(r.valor_pago)), 0);
  const entradas30 = data.mov.filter(m => m.tipo === "entrada").reduce((s, m) => s + Number(m.valor), 0);
  const saidas30 = data.mov.filter(m => m.tipo === "saida").reduce((s, m) => s + Number(m.valor), 0);
  const saldo30 = entradas30 - saidas30;

  const cards = [
    { label: "A Pagar (aberto)", value: aPagar, tone: "text-orange-600" },
    { label: "Vencidas", value: vencidas, tone: "text-destructive" },
    { label: "A Receber (aberto)", value: aReceber, tone: "text-blue-600" },
    { label: "Entradas 30d", value: entradas30, tone: "text-emerald-600" },
    { label: "Saídas 30d", value: saidas30, tone: "text-red-600" },
    { label: "Saldo 30d", value: saldo30, tone: saldo30 >= 0 ? "text-emerald-600" : "text-destructive" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(c => (
          <Card key={c.label}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className={`text-2xl font-semibold ${c.tone}`}>{fmt(c.value)}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Próximos vencimentos (a pagar)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.cp.filter(r => r.status === "aberta").slice(0, 10).map((r, i) => (
                <TableRow key={i}><TableCell>{r.vencimento}</TableCell><TableCell>{fmt(Number(r.valor))}</TableCell><TableCell>{r.status}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
