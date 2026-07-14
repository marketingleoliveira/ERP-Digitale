import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/oee")({
  ssr: false,
  component: OeePage,
});

type Base = {
  min_operado: number;
  qtd_produzida: number;
  qtd_refugo: number;
  performance_pct: number | null;
  qualidade_pct: number | null;
  oee_pct: number | null;
};
type OeeMaquina = Base & { maquina_id: string; numero: number | null; nome: string; disponibilidade_pct: number | null; min_parado: number };
type OeeOperador = Base & { funcionario_id: string; nome: string };
type OeeArtigo = Base & { product_id: string; codigo: string | null; nome: string };
type OeeTurno = Base & { turno: string };
type OeeMensal = Base & { mes: string; disponibilidade_pct: number | null; min_parado: number };

function classify(pct: number | null): { label: string; className: string } {
  if (pct === null || pct === undefined) return { label: "s/d", className: "bg-muted text-muted-foreground" };
  if (pct < 60) return { label: "Crítico", className: "bg-destructive text-destructive-foreground" };
  if (pct < 75) return { label: "Atenção", className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" };
  if (pct < 85) return { label: "Bom", className: "bg-blue-500/20 text-blue-700 dark:text-blue-400" };
  return { label: "Excelente", className: "bg-success/20 text-success" };
}

function Pct({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono">{v.toFixed(1)}%</span>;
}

function OeeCell({ v }: { v: number | null }) {
  const c = classify(v);
  return (
    <div className="flex items-center gap-2 justify-end">
      <Pct v={v} />
      <Badge className={c.className}>{c.label}</Badge>
    </div>
  );
}

function useView<T>(table: string, orderBy?: string) {
  return useQuery({
    queryKey: ["oee", table],
    queryFn: async (): Promise<T[]> => {
      let q = supabase.from(table as never).select("*");
      if (orderBy) q = q.order(orderBy as never, { ascending: false } as never);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
}

function OeePage() {
  const maquinas = useView<OeeMaquina>("vw_oee_maquina_periodo", "oee_pct");
  const operadores = useView<OeeOperador>("vw_oee_operador", "oee_pct");
  const artigos = useView<OeeArtigo>("vw_oee_artigo", "oee_pct");
  const turnos = useView<OeeTurno>("vw_oee_turno");
  const mensal = useView<OeeMensal>("vw_oee_mensal", "mes");

  const geral = maquinas.data ?? [];
  const oeeMedio = geral.length
    ? geral.filter((m) => m.oee_pct !== null).reduce((s, m) => s + (m.oee_pct ?? 0), 0) /
      (geral.filter((m) => m.oee_pct !== null).length || 1)
    : 0;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="OEE Industrial"
        description="Overall Equipment Effectiveness — janela: últimos 30 dias (mensal: 12 meses)"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="OEE Médio (30d)" value={oeeMedio} icon icon2 />
        <StatCard label="Máquinas ativas" raw={String(geral.length)} />
        <StatCard label="Total produzido" raw={geral.reduce((s, m) => s + Number(m.qtd_produzida || 0), 0).toFixed(0)} suffix="kg" />
        <StatCard label="Refugo total" raw={geral.reduce((s, m) => s + Number(m.qtd_refugo || 0), 0).toFixed(0)} suffix="kg" />
      </div>

      <ClassificationLegend />

      <Tabs defaultValue="maquina">
        <TabsList>
          <TabsTrigger value="maquina">Por Máquina</TabsTrigger>
          <TabsTrigger value="turno">Por Turno</TabsTrigger>
          <TabsTrigger value="operador">Por Operador</TabsTrigger>
          <TabsTrigger value="artigo">Por Artigo</TabsTrigger>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="maquina">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead className="text-right">Min operado</TableHead>
                  <TableHead className="text-right">Min parado</TableHead>
                  <TableHead className="text-right">Disponib.</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                  <TableHead className="text-right">Qualidade</TableHead>
                  <TableHead className="text-right w-56">OEE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Loading loading={maquinas.isLoading} colSpan={7} empty={geral.length === 0} />
                {geral.map((m) => (
                  <TableRow key={m.maquina_id}>
                    <TableCell className="font-medium">#{m.numero ?? "—"} · {m.nome}</TableCell>
                    <TableCell className="text-right font-mono">{Number(m.min_operado).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(m.min_parado).toFixed(0)}</TableCell>
                    <TableCell className="text-right"><Pct v={m.disponibilidade_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={m.performance_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={m.qualidade_pct} /></TableCell>
                    <TableCell className="text-right"><OeeCell v={m.oee_pct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="turno">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-right">Min operado</TableHead>
                  <TableHead className="text-right">Produzido</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                  <TableHead className="text-right">Qualidade</TableHead>
                  <TableHead className="text-right w-56">OEE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Loading loading={turnos.isLoading} colSpan={6} empty={(turnos.data ?? []).length === 0} />
                {(turnos.data ?? []).map((t) => (
                  <TableRow key={t.turno}>
                    <TableCell className="font-medium">{t.turno}</TableCell>
                    <TableCell className="text-right font-mono">{Number(t.min_operado).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(t.qtd_produzida).toFixed(1)}</TableCell>
                    <TableCell className="text-right"><Pct v={t.performance_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={t.qualidade_pct} /></TableCell>
                    <TableCell className="text-right"><OeeCell v={t.oee_pct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="operador">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-right">Min operado</TableHead>
                  <TableHead className="text-right">Produzido</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                  <TableHead className="text-right">Qualidade</TableHead>
                  <TableHead className="text-right w-56">OEE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Loading loading={operadores.isLoading} colSpan={6} empty={(operadores.data ?? []).length === 0} />
                {(operadores.data ?? []).map((o) => (
                  <TableRow key={o.funcionario_id}>
                    <TableCell className="font-medium">{o.nome}</TableCell>
                    <TableCell className="text-right font-mono">{Number(o.min_operado).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(o.qtd_produzida).toFixed(1)}</TableCell>
                    <TableCell className="text-right"><Pct v={o.performance_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={o.qualidade_pct} /></TableCell>
                    <TableCell className="text-right"><OeeCell v={o.oee_pct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="artigo">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artigo</TableHead>
                  <TableHead className="text-right">Produzido</TableHead>
                  <TableHead className="text-right">Refugo</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                  <TableHead className="text-right">Qualidade</TableHead>
                  <TableHead className="text-right w-56">OEE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Loading loading={artigos.isLoading} colSpan={6} empty={(artigos.data ?? []).length === 0} />
                {(artigos.data ?? []).map((a) => (
                  <TableRow key={a.product_id}>
                    <TableCell className="font-medium">{a.codigo ?? "—"} — {a.nome}</TableCell>
                    <TableCell className="text-right font-mono">{Number(a.qtd_produzida).toFixed(1)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(a.qtd_refugo).toFixed(1)}</TableCell>
                    <TableCell className="text-right"><Pct v={a.performance_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={a.qualidade_pct} /></TableCell>
                    <TableCell className="text-right"><OeeCell v={a.oee_pct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="mensal">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Min operado</TableHead>
                  <TableHead className="text-right">Min parado</TableHead>
                  <TableHead className="text-right">Disponib.</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                  <TableHead className="text-right">Qualidade</TableHead>
                  <TableHead className="text-right w-56">OEE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Loading loading={mensal.isLoading} colSpan={7} empty={(mensal.data ?? []).length === 0} />
                {(mensal.data ?? []).map((m) => (
                  <TableRow key={m.mes}>
                    <TableCell className="font-medium">
                      {new Date(m.mes).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right font-mono">{Number(m.min_operado).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(m.min_parado).toFixed(0)}</TableCell>
                    <TableCell className="text-right"><Pct v={m.disponibilidade_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={m.performance_pct} /></TableCell>
                    <TableCell className="text-right"><Pct v={m.qualidade_pct} /></TableCell>
                    <TableCell className="text-right"><OeeCell v={m.oee_pct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Loading({ loading, colSpan, empty }: { loading: boolean; colSpan: number; empty: boolean }) {
  if (loading) return (
    <TableRow><TableCell colSpan={colSpan} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
  );
  if (empty) return (
    <TableRow><TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">Sem apontamentos no período.</TableCell></TableRow>
  );
  return null;
}

function StatCard({ label, value, raw, suffix, icon }: { label: string; value?: number; raw?: string; suffix?: string; icon?: boolean; icon2?: boolean }) {
  const cls = value !== undefined ? classify(value).className : "";
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {icon && <Gauge className="h-3 w-3" />} {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold font-mono">
          {value !== undefined ? value.toFixed(1) : raw}
          {value !== undefined && "%"}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </div>
        {value !== undefined && (
          <Badge className={cls}>{classify(value).label}</Badge>
        )}
      </div>
    </Card>
  );
}

function ClassificationLegend() {
  const items = [
    { r: "< 60%", l: "Crítico", c: "bg-destructive text-destructive-foreground" },
    { r: "60–75%", l: "Atenção", c: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
    { r: "75–85%", l: "Bom", c: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
    { r: "> 85%", l: "Excelente", c: "bg-success/20 text-success" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Classificação:</span>
      {items.map((i) => (
        <Badge key={i.l} className={i.c}>{i.l} <span className="ml-1 opacity-70">{i.r}</span></Badge>
      ))}
    </div>
  );
}
