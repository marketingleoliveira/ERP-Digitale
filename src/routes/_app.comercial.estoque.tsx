import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getEstoqueComercial } from "@/lib/comercial.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { Box, Package, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/comercial/estoque")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["estoque_comercial"],
      queryFn: () => getEstoqueComercial(),
    });
  },
  component: EstoqueComercialPage,
});

function EstoqueComercialPage() {
  const fetchEstoque = useServerFn(getEstoqueComercial);
  const { data: estoque } = useSuspenseQuery({
    queryKey: ["estoque_comercial"],
    queryFn: () => fetchEstoque(),
  });

  const stats = {
    total_fisico: estoque?.reduce((acc, curr) => acc + Number(curr.saldo_fisico), 0) || 0,
    total_disponivel: estoque?.reduce((acc, curr) => acc + Number(curr.saldo_disponivel), 0) || 0,
    total_reservado: estoque?.reduce((acc, curr) => acc + Number(curr.saldo_reservado), 0) || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque Comercial</h1>
          <p className="text-muted-foreground">Visão consolidada de saldos liberados para venda.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Físico Total</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_fisico.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Total em armazém</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.total_disponivel.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Livre para novos pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Reservado</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.total_reservado.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Comprometido com vendas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lotes em Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Artigo</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead className="text-right">Físico</TableHead>
                <TableHead className="text-right">Aprovado</TableHead>
                <TableHead className="text-right">Reservado</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estoque?.map((l) => (
                <TableRow key={l.lote_id}>
                  <TableCell className="font-medium">{l.numero_lote}</TableCell>
                  <TableCell>{l.artigo_id || "Não informado"}</TableCell>
                  <TableCell>{l.deposito || "Geral"}</TableCell>
                  <TableCell className="text-right">{Number(l.saldo_fisico).toLocaleString()} kg</TableCell>
                  <TableCell className="text-right">{Number(l.saldo_aprovado).toLocaleString()} kg</TableCell>
                  <TableCell className="text-right text-amber-600">{Number(l.saldo_reservado).toLocaleString()} kg</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    {Number(l.saldo_disponivel).toLocaleString()} kg
                  </TableCell>
                  <TableCell>
                    {l.liberado_comercial ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Liberado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Bloqueado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
