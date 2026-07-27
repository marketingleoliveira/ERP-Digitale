import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, PlayCircle, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/producao/plano")({
  ssr: false,
  head: () => ({ meta: [{ title: "Planejamento de Produção (Plano)" }] }),
  component: PlanoPage,
});

function PlanoPage() {
  const { data: ops = [], isLoading } = useQuery({
    queryKey: ["plano-producao-ops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_producao" as never)
        .select("id, numero, status, prioridade, data_abertura, data_prevista")
        .in("status", ["planejada", "programada"])
        .order("prioridade", { ascending: true });
      if (error) throw error;
      return data as unknown as { id: string; numero: number; status: string; prioridade: number; data_abertura: string; data_prevista: string | null }[];
    },
  });

  const { data: capacidade = [] } = useQuery({
    queryKey: ["plano-capacidade-semanal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_capacidade_semanal" as never).select("*");
      if (error) throw error;
      return data as unknown as { maquina: string; capacidade_efetiva_semana_kg: number }[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Planejamento de Produção (Plano)"
        description="Fila de ordens planejadas e análise de carga de máquinas."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-blue-500" /> OPs Planejadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ops.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" /> Carga Total Estimada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" /> Capacidade Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capacidade.reduce((acc, c) => acc + (c.capacidade_efetiva_semana_kg || 0), 0).toFixed(0)} kg
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fila de Prioridade (Planejadas/Programadas)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OP</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Previsto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && ops.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma OP em fila de planejamento.
                    </TableCell>
                  </TableRow>
                )}
                {ops.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-mono font-semibold">#{op.numero}</TableCell>
                    <TableCell>
                      <Badge variant={op.prioridade <= 3 ? "destructive" : "secondary"}>
                        {op.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {op.data_prevista ? new Date(op.data_prevista).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {op.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Carga por Máquina</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead className="text-right">Capacidade Semanal</TableHead>
                  <TableHead className="text-right">Carga Alocada</TableHead>
                  <TableHead className="text-right">Ocupação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacidade.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Sem dados de capacidade.
                    </TableCell>
                  </TableRow>
                )}
                {capacidade.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.maquina}</TableCell>
                    <TableCell className="text-right font-mono">{c.capacidade_efetiva_semana_kg?.toFixed(1)} kg</TableCell>
                    <TableCell className="text-right font-mono">---</TableCell>
                    <TableCell className="text-right">
                       <Badge variant="outline">0%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
        <h4 className="font-semibold flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4" /> Módulo em Evolução
        </h4>
        <p>
          Este painel consolida as ordens que aguardam início de produção. 
          A alocação detalhada de carga por máquina e o cálculo de Gantt 
          utilizam os dados de Roteiros e Capacidade configurados no módulo PCP.
        </p>
      </div>
    </div>
  );
}
