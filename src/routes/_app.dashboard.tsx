import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, TrendingUp, Factory, AlertTriangle, Package, Users,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  faturamentoMensal, kpis, ordens, producaoStatus, produtosMaisVendidos,
  vendasSemana, formatBRL, formatInt,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const metaPct = Math.round((kpis.faturamentoMes / kpis.metaMes) * 100);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Executivo"
        description="Visão em tempo real da operação Digitale Têxtil."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento do dia" value={formatBRL(kpis.faturamentoHoje)} trend={12.4} hint="vs. ontem" icon={<Wallet className="h-5 w-5" />} accent="primary" />
        <StatCard label="Faturamento do mês" value={formatBRL(kpis.faturamentoMes)} trend={8.2} hint="vs. mês anterior" icon={<TrendingUp className="h-5 w-5" />} accent="success" />
        <StatCard label="Pedidos em produção" value={String(kpis.pedidosProducao)} hint={`${kpis.ordensAbertas} OPs abertas`} icon={<Factory className="h-5 w-5" />} accent="info" />
        <StatCard label="Pedidos atrasados" value={String(kpis.pedidosAtrasados)} trend={-2} hint="requer atenção" icon={<AlertTriangle className="h-5 w-5" />} accent="destructive" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estoque disponível" value={formatInt(kpis.estoqueDisponivel) + " un."} icon={<Package className="h-5 w-5" />} accent="primary" />
        <StatCard label="Clientes ativos" value={formatInt(kpis.clientesAtivos)} trend={5.1} icon={<Users className="h-5 w-5" />} accent="success" />
        <StatCard label="Contas a receber" value={formatBRL(kpis.contasReceber)} icon={<ArrowDownRight className="h-5 w-5" />} accent="success" />
        <StatCard label="Contas a pagar" value={formatBRL(kpis.contasPagar)} icon={<ArrowUpRight className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento vs Despesas (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={faturamentoMensal}>
                <defs>
                  <linearGradient id="rec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="desp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Area type="monotone" dataKey="receita" stroke="var(--color-chart-1)" fill="url(#rec)" name="Receita" />
                <Area type="monotone" dataKey="despesa" stroke="var(--color-chart-4)" fill="url(#desp)" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Meta do mês</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{metaPct}%</span>
                <span className="text-sm text-muted-foreground">da meta</span>
              </div>
              <Progress value={metaPct} className="mt-3" />
              <p className="mt-3 text-sm text-muted-foreground">
                {formatBRL(kpis.faturamentoMes)} de {formatBRL(kpis.metaMes)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ticket médio</p>
              <p className="mt-1 text-xl font-bold">{formatBRL(4128.35)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Vendas da semana</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Produção — Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={producaoStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {producaoStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {producaoStatus.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Produtos mais vendidos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {produtosMaisVendidos.map((p) => (
                <div key={p.nome} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatInt(p.qtd)} unidades</p>
                  </div>
                  <span className="text-sm font-semibold">{formatBRL(p.receita)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ordens de Produção recentes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {ordens.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.id} — {o.produto}</p>
                    <p className="text-xs text-muted-foreground truncate">{o.cliente} • prazo {o.prazo}</p>
                  </div>
                  <Badge variant="outline">{o.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
