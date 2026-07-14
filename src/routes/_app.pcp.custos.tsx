import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/pcp/custos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Custos Industriais" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n: number | null | undefined, d = 2) =>
  (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

function MargemBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <Badge variant="outline">—</Badge>;
  if (pct < 0) return <Badge variant="destructive">{num(pct)}%</Badge>;
  if (pct < 15) return <Badge className="bg-orange-500">{num(pct)}%</Badge>;
  if (pct < 30) return <Badge className="bg-yellow-500">{num(pct)}%</Badge>;
  return <Badge className="bg-green-600">{num(pct)}%</Badge>;
}

function useView<T>(name: string) {
  return useQuery({
    queryKey: [name],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from(name).select("*").limit(500);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

type OpRow = {
  op_id: string; numero: number; status: string;
  maquina_nome: string | null; pedido_numero: number | null; cliente_nome: string | null;
  custo_mp: number; custo_mo: number; custo_cif: number;
  custo_perdas: number; custo_retrabalho: number; custo_real: number;
  receita_pedido: number; margem_valor: number; margem_pct: number | null;
  qtd_produzida: number;
};

function Page() {
  const ops = useView<OpRow>("vw_custos_op");
  const clientes = useView<Record<string, unknown>>("vw_custos_cliente");
  const maquinas = useView<Record<string, unknown>>("vw_custos_maquina");
  const produtos = useView<Record<string, unknown>>("vw_custos_produto");

  const totals = (ops.data ?? []).reduce(
    (a, r) => ({
      real: a.real + Number(r.custo_real || 0),
      receita: a.receita + Number(r.receita_pedido || 0),
      perdas: a.perdas + Number(r.custo_perdas || 0),
      retrabalho: a.retrabalho + Number(r.custo_retrabalho || 0),
    }),
    { real: 0, receita: 0, perdas: 0, retrabalho: 0 }
  );
  const margemGeral = totals.receita > 0 ? ((totals.receita - totals.real) / totals.receita) * 100 : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custos Industriais</h1>
        <p className="text-sm text-muted-foreground">
          MP · MO · CIF · Perdas · Retrabalho · Margem — dados de <code>op_custos</code> + apontamentos + reprocessos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Custo Real</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{brl(totals.real)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Receita</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{brl(totals.receita)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Perdas + Retrabalho</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-destructive">{brl(totals.perdas + totals.retrabalho)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Margem Geral</CardTitle></CardHeader><CardContent className="text-2xl font-semibold"><MargemBadge pct={margemGeral} /></CardContent></Card>
      </div>

      <Tabs defaultValue="op">
        <TabsList>
          <TabsTrigger value="op">Por OP</TabsTrigger>
          <TabsTrigger value="cliente">Por Cliente</TabsTrigger>
          <TabsTrigger value="maquina">Por Máquina</TabsTrigger>
          <TabsTrigger value="produto">Por Produto</TabsTrigger>
        </TabsList>

        <TabsContent value="op">
          <Card><CardContent className="pt-6 overflow-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>OP</TableHead><TableHead>Cliente</TableHead><TableHead>Máquina</TableHead>
                <TableHead className="text-right">MP</TableHead><TableHead className="text-right">MO</TableHead>
                <TableHead className="text-right">CIF</TableHead><TableHead className="text-right">Perdas</TableHead>
                <TableHead className="text-right">Retrab.</TableHead><TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Receita</TableHead><TableHead className="text-right">Margem</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ops.isLoading ? <TableRow><TableCell colSpan={11}>Carregando…</TableCell></TableRow> :
                  (ops.data ?? []).map(r => (
                    <TableRow key={r.op_id}>
                      <TableCell className="font-mono">#{r.numero}</TableCell>
                      <TableCell>{r.cliente_nome ?? "—"}</TableCell>
                      <TableCell>{r.maquina_nome ?? "—"}</TableCell>
                      <TableCell className="text-right">{brl(r.custo_mp)}</TableCell>
                      <TableCell className="text-right">{brl(r.custo_mo)}</TableCell>
                      <TableCell className="text-right">{brl(r.custo_cif)}</TableCell>
                      <TableCell className="text-right text-destructive">{brl(r.custo_perdas)}</TableCell>
                      <TableCell className="text-right text-destructive">{brl(r.custo_retrabalho)}</TableCell>
                      <TableCell className="text-right font-semibold">{brl(r.custo_real)}</TableCell>
                      <TableCell className="text-right">{brl(r.receita_pedido)}</TableCell>
                      <TableCell className="text-right"><MargemBadge pct={r.margem_pct} /></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="cliente">
          <AggTable data={clientes.data} loading={clientes.isLoading} nameKey="cliente_nome" showReceita />
        </TabsContent>
        <TabsContent value="maquina">
          <AggTable data={maquinas.data} loading={maquinas.isLoading} nameKey="maquina_nome" showKg />
        </TabsContent>
        <TabsContent value="produto">
          <AggTable data={produtos.data} loading={produtos.isLoading} nameKey="produto_nome" showKg />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AggTable({
  data, loading, nameKey, showReceita, showKg,
}: {
  data: Record<string, unknown>[] | undefined;
  loading: boolean; nameKey: string;
  showReceita?: boolean; showKg?: boolean;
}) {
  return (
    <Card><CardContent className="pt-6 overflow-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="text-right">OPs</TableHead>
          {showKg && <TableHead className="text-right">Qtd (kg)</TableHead>}
          <TableHead className="text-right">Custo real</TableHead>
          <TableHead className="text-right">Perdas</TableHead>
          <TableHead className="text-right">Retrab.</TableHead>
          {showKg && <TableHead className="text-right">Custo/kg</TableHead>}
          {showReceita && <><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">Margem</TableHead></>}
        </TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={8}>Carregando…</TableCell></TableRow> :
            (data ?? []).map((r, i) => (
              <TableRow key={i}>
                <TableCell>{String(r[nameKey] ?? "—")}</TableCell>
                <TableCell className="text-right">{Number(r.ops ?? 0)}</TableCell>
                {showKg && <TableCell className="text-right">{num(Number(r.qtd_produzida ?? 0), 1)}</TableCell>}
                <TableCell className="text-right font-semibold">{brl(Number(r.custo_real ?? 0))}</TableCell>
                <TableCell className="text-right text-destructive">{brl(Number(r.custo_perdas ?? 0))}</TableCell>
                <TableCell className="text-right text-destructive">{brl(Number(r.custo_retrabalho ?? 0))}</TableCell>
                {showKg && <TableCell className="text-right">{brl(Number(r.custo_medio_kg ?? r.custo_medio_un ?? 0))}</TableCell>}
                {showReceita && <>
                  <TableCell className="text-right">{brl(Number(r.receita ?? 0))}</TableCell>
                  <TableCell className="text-right"><MargemBadge pct={r.margem_pct as number | null} /></TableCell>
                </>}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}
