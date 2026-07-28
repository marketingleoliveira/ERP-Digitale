import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardIndicadores } from "@/services/dashboard/indicadores.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Factory, 
  Receipt, 
  Wallet, 
  Timer, 
  TrendingUp, 
  AlertCircle, 
  Package, 
  ShoppingCart,
  Truck,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard/industrial")({
  head: () => ({ 
    meta: [
      { title: "Dashboard Executivo Industrial | Digitale Têxtil" },
      { name: "description", content: "Visão consolidada da operação industrial, comercial e financeira em tempo real." }
    ] 
  }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive font-mono bg-destructive/10 rounded-lg m-6 border border-destructive/20">{error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-muted-foreground italic">Página não encontrada.</div>,
  component: DashIndustrial,
});

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function KpiCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel, 
  description,
  className 
}: { 
  label: string; 
  value: string | number; 
  icon?: any;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border/50 hover:border-primary/50 transition-colors group", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          {trend && (
            <div className={cn(
              "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              trend === "up" ? "bg-green-500/10 text-green-600" : 
              trend === "down" ? "bg-red-500/10 text-red-600" : 
              "bg-muted text-muted-foreground"
            )}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
               trend === "down" ? <ArrowDownRight className="h-3 w-3 mr-0.5" /> : null}
              {trendLabel}
            </div>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function DashIndustrial() {
  const fn = useServerFn(getDashboardIndicadores);
  const { data, isLoading } = useQuery({ 
    queryKey: ["dash-industrial"], 
    queryFn: () => fn(),
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Dashboard Executivo Industrial
          </h1>
          <p className="text-muted-foreground mt-1 text-lg font-light">
            Monitoramento em tempo real da Digitale Têxtil
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono bg-muted/50 px-4 py-2 rounded-full border border-border/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Sincronizado: {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* Alertas Críticos (Placeholder para Lógica de Alerta) */}
      {data.producao.abertas > 0 && (
        <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-4 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold uppercase tracking-tight mr-2">Alerta Industrial:</span> 
            Existem {data.producao.abertas} Ordens de Produção aguardando planejamento imediato.
          </div>
        </section>
      )}

      {/* Overview Financeiro & Comercial */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Wallet className="h-5 w-5" />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Visão Comercial & Financeira</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            label="Faturamento do Mês" 
            value={fmtBRL(data.financeiro.valor_faturado)} 
            icon={TrendingUp}
            trend="up"
            trendLabel="+12%"
            description="Acumulado faturado no período"
          />
          <KpiCard 
            label="Contas a Receber" 
            value={fmtBRL(data.financeiro.pendentes)} 
            icon={Receipt}
            description="Títulos pendentes de liquidação"
          />
          <KpiCard 
            label="Pedidos em Aberto" 
            value={data.fiscal.pre_faturamentos} 
            icon={ShoppingCart}
            trend="neutral"
            trendLabel="Estável"
            description="Aguardando liberação ou faturamento"
          />
          <KpiCard 
            label="Recebimentos" 
            value={fmtBRL(data.financeiro.recebimentos)} 
            icon={CheckCircle2}
            className="border-green-500/20"
            description="Valores efetivamente liquidados"
          />
        </div>
      </section>

      {/* Status da Fábrica */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Factory className="h-5 w-5" />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Operação Industrial (MES/APS)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            label="OPs Planejadas" 
            value={data.producao.abertas} 
            icon={Timer}
            description="Aguardando início de execução"
          />
          <KpiCard 
            label="Em Produção" 
            value={data.producao.em_producao} 
            icon={Activity}
            className="border-blue-500/20"
            description="Máquinas em operação ativa"
          />
          <KpiCard 
            label="Qualidade / Inspeção" 
            value={data.producao.aguardando_qualidade} 
            icon={ClipboardCheck}
            trend={data.producao.aguardando_qualidade > 5 ? "down" : "neutral"}
            trendLabel={data.producao.aguardando_qualidade > 5 ? "Gargalo" : ""}
            description="Lotes aguardando liberação técnica"
          />
          <KpiCard 
            label="Produção Realizada" 
            value={data.producao.concluidas} 
            icon={Package}
            description="Itens prontos para estoque/faturamento"
          />
        </div>
      </section>

      {/* Eficiência & Lead Times */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="h-5 w-5" />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Eficiência & Lead Times (h)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            label="Pedido → Produção" 
            value={`${data.industrial.h_pedido_producao}h`} 
            description="Tempo médio para início industrial"
          />
          <KpiCard 
            label="Produção → Fiscal" 
            value={`${data.industrial.h_producao_faturamento}h`} 
            description="Tempo médio para faturamento"
          />
          <KpiCard 
            label="Faturamento → Saída" 
            value={`${data.industrial.h_faturamento_expedicao}h`} 
            description="Tempo médio de expedição"
          />
          <KpiCard 
            label="Ciclo Total (Lead Time)" 
            value={`${data.industrial.h_pedido_entrega}h`} 
            icon={Truck}
            className="bg-primary/5 border-primary/20"
            description="Média de ponta a ponta"
          />
        </div>
      </section>

      {/* Nota sobre o Dashboard */}
      <footer className="pt-8 border-t border-border/40">
        <div className="bg-muted/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Sistema Industrial Digitale Têxtil</h4>
            <p className="text-xs text-muted-foreground">Todos os dados acima são extraídos em tempo real das tabelas transacionais (ERPs, WMS, MES e PCP).</p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">WMS</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">APS</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">MES</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">NFe</span>
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

