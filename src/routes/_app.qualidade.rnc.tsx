import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getRNCs } from "@/lib/comercial.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, FileText, Clock, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/qualidade/rnc")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["rncs"],
      queryFn: () => getRNCs(),
    });
  },
  component: RNCPage,
});

function RNCPage() {
  const fetchRNCs = useServerFn(getRNCs);
  const { data: rncs } = useSuspenseQuery({
    queryKey: ["rncs"],
    queryFn: () => fetchRNCs(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberta":
        return <Badge variant="destructive">Aberta</Badge>;
      case "em_analise":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Em Análise</Badge>;
      case "concluida":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RNC - Relatório de Não Conformidade</h1>
          <p className="text-muted-foreground">Gestão de ocorrências e planos de ação da qualidade.</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Nova RNC
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de RNCs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rncs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertas</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {rncs?.filter(r => r.status === 'aberta').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {rncs?.filter(r => r.status === 'em_analise').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {rncs?.filter(r => r.status === 'concluida').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rncs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    Nenhuma não conformidade registrada.
                  </TableCell>
                </TableRow>
              ) : (
                rncs?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.titulo}</TableCell>
                    <TableCell>{r.lote?.numero_lote || "N/A"}</TableCell>
                    <TableCell>{r.responsavel?.full_name || "Não atribuído"}</TableCell>
                    <TableCell>{r.prazo ? new Date(r.prazo).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
