import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Factory, Gauge, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/producao/industrial")({
  component: IndustrialDashboard,
});

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${Number(v).toFixed(1)}%`;
}
function fmtNum(v: number | null | undefined, d = 2) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function IndustrialDashboard() {
  const { data: oee } = useQuery({
    queryKey: ["vw_oee_maquina"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_oee_maquina" as never).select("*");
      if (error) throw error;
      return (data as unknown as OEERow[]) ?? [];
    },
  });

  const { data: capacidade } = useQuery({
    queryKey: ["vw_capacidade_semanal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_capacidade_semanal" as never).select("*");
      if (error) throw error;
      return (data as unknown as CapRow[]) ?? [];
    },
  });

  const { data: custos } = useQuery({
    queryKey: ["vw_custo_op"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_custo_op" as never)
        .select("*")
        .order("calculado_em", { ascending: false, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      return (data as unknown as CustoRow[]) ?? [];
    },
  });

  const { data: reprocessos } = useQuery({
    queryKey: ["op_reprocessos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_reprocessos" as never)
        .select("id, motivo, quantidade, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data as unknown as ReprocessoRow[]) ?? [];
    },
  });

  const oeeMedio =
    oee && oee.length
      ? oee.reduce((acc, r) => {
          const d = r.disponibilidade_pct ?? 0;
          const p = r.performance_pct ?? 0;
          const q = r.qualidade_pct ?? 0;
          return acc + (d * p * q) / 10000;
        }, 0) / oee.length
      : 0;

  const capacidadeSemanaTotal = capacidade?.reduce((acc, r) => acc + Number(r.capacidade_efetiva_semana_kg ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Factory className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Análise Industrial</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4" /> OEE Médio (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmtPct(oeeMedio)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Capacidade Efetiva/Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmtNum(capacidadeSemanaTotal, 0)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Máquinas Monitoradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{oee?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Reprocessos Abertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reprocessos?.filter((r) => r.status !== "concluido" && r.status !== "cancelado").length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OEE por Máquina (Disponibilidade × Performance × Qualidade)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead className="text-right">Disponibilidade</TableHead>
                <TableHead className="text-right">Performance</TableHead>
                <TableHead className="text-right">Qualidade</TableHead>
                <TableHead className="text-right">OEE</TableHead>
                <TableHead className="text-right">Produzido (kg)</TableHead>
                <TableHead className="text-right">Refugo (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oee?.map((r) => {
                const oeeVal = ((r.disponibilidade_pct ?? 0) * (r.performance_pct ?? 0) * (r.qualidade_pct ?? 0)) / 10000;
                return (
                  <TableRow key={r.maquina_id}>
                    <TableCell className="font-medium">
                      #{r.numero} — {r.maquina}
                    </TableCell>
                    <TableCell className="text-right">{fmtPct(r.disponibilidade_pct)}</TableCell>
                    <TableCell className="text-right">{fmtPct(r.performance_pct)}</TableCell>
                    <TableCell className="text-right">{fmtPct(r.qualidade_pct)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={oeeVal >= 75 ? "default" : oeeVal >= 50 ? "secondary" : "destructive"}>
                        {fmtPct(oeeVal)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmtNum(r.qtd_produzida, 1)}</TableCell>
                    <TableCell className="text-right">{fmtNum(r.qtd_refugo, 1)}</TableCell>
                  </TableRow>
                );
              })}
              {!oee?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    Sem dados. Cadastre a capacidade nominal das máquinas em /producao/bom e registre apontamentos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Custo Industrial — Últimas OPs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OP</TableHead>
                  <TableHead className="text-right">MP</TableHead>
                  <TableHead className="text-right">MO</TableHead>
                  <TableHead className="text-right">CIF</TableHead>
                  <TableHead className="text-right">R$/kg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos?.map((c) => (
                  <TableRow key={c.op_id}>
                    <TableCell>#{c.numero}</TableCell>
                    <TableCell className="text-right">{fmtNum(c.custo_materia_prima)}</TableCell>
                    <TableCell className="text-right">{fmtNum(c.custo_mao_obra)}</TableCell>
                    <TableCell className="text-right">{fmtNum(c.custo_cif)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmtNum(c.custo_por_kg, 4)}</TableCell>
                  </TableRow>
                ))}
                {!custos?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Execute op_calcular_custo(op_id) para consolidar custos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reprocessos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reprocessos?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-xs truncate">{r.motivo}</TableCell>
                    <TableCell className="text-right">{fmtNum(r.quantidade, 1)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "concluido" ? "default" : "secondary"}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!reprocessos?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      Nenhum reprocesso registrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface OEERow {
  maquina_id: string;
  numero: number;
  maquina: string;
  disponibilidade_pct: number | null;
  performance_pct: number | null;
  qualidade_pct: number | null;
  qtd_produzida: number | null;
  qtd_refugo: number | null;
}
interface CapRow {
  maquina_id: string;
  capacidade_efetiva_semana_kg: number | null;
}
interface CustoRow {
  op_id: string;
  numero: number;
  custo_materia_prima: number | null;
  custo_mao_obra: number | null;
  custo_cif: number | null;
  custo_por_kg: number | null;
}
interface ReprocessoRow {
  id: string;
  motivo: string;
  quantidade: number;
  status: string;
  created_at: string;
}
