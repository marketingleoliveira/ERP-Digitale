import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  BarChart3, 
  Factory, 
  AlertTriangle, 
  ClipboardList, 
  ShoppingCart, 
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  Ban,
  Settings,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeDashboardData } from "@/services/dashboard/home.functions";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: DashboardHome,
});

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function DashboardHome() {
  const getDashData = useServerFn(getHomeDashboardData);
  const { data, isLoading } = useQuery({
    queryKey: ["home-dashboard"],
    queryFn: () => getDashData(),
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { producao, maquinas, financeiro } = data;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo Industrial</h1>
           <p className="text-xs text-muted-foreground mt-1">Digitale Têxtil — Operações em Tempo Real</p>
        </div>
        <div className="flex items-center gap-3">
           <Link to="/roadmap-industrial" className="text-[10px] flex items-center gap-1 uppercase font-bold text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 px-2 py-1 rounded border border-blue-100">
              <ShieldCheck className="h-3 w-3" /> Sprint 2 Roadmap
           </Link>
           <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border font-mono">
              SYNC: {new Date().toLocaleTimeString("pt-BR")}
           </div>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          label="Produção em Andamento" 
          value={`${producao.ops_andamento} OPs`} 
          icon={Factory}
        />
        <KpiCard 
          label="Cumprimento do Plano" 
          value="0%" 
          icon={TrendingUp}
          subtext="Baseado em metas diárias"
        />
        <KpiCard 
          label="Disponibilidade Máquinas" 
          value={`${maquinas.operacao} / ${maquinas.total}`} 
          icon={Settings}
          color={maquinas.operacao < maquinas.total / 2 ? "text-yellow-500" : "text-green-500"}
        />
        <KpiCard 
          label="Contas Vencidas" 
          value={fmtBRL(financeiro.vencidos)} 
          icon={AlertTriangle}
          color="text-red-500"
        />
      </div>

      {/* Seções do Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-muted/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <Factory className="h-3 w-3 text-blue-500" /> Situação da Fábrica
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                <StatusItem label="Produzindo" count={maquinas.operacao} icon={CheckCircle2} color="bg-green-500" />
                <StatusItem label="Setup" count={0} icon={Clock} color="bg-yellow-500" />
                <StatusItem label="Paradas" count={maquinas.paradas} icon={Ban} color="bg-red-500" />
                <StatusItem label="Manutenção" count={maquinas.manutencao} icon={Settings} color="bg-orange-500" />
                <StatusItem label="Aguardo Mat." count={0} icon={Package} color="bg-blue-500" />
                <StatusItem label="Sem Prog." count={maquinas.total - maquinas.operacao - maquinas.paradas - maquinas.manutencao} icon={Clock} color="bg-gray-400" />
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-red-500" /> Alertas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {producao.ops_atrasadas > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <div className="p-2 bg-red-500/10 rounded-full"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">Atraso Crítico</p>
                    <p className="text-xs text-red-500/80">{producao.ops_atrasadas} OPs fora do prazo</p>
                  </div>
                </div>
              )}
              {financeiro.vencidos > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                  <div className="p-2 bg-yellow-500/10 rounded-full"><AlertTriangle className="h-4 w-4 text-yellow-500" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-tight">Pendência Financeira</p>
                    <p className="text-xs text-yellow-500/80">Contas vencidas detectadas</p>
                  </div>
                </div>
              )}
              {producao.ops_atrasadas === 0 && financeiro.vencidos === 0 && (
                <div className="flex flex-col items-center py-8 opacity-40">
                   <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                   <p className="text-[10px] uppercase font-bold tracking-widest">Tudo em conformidade</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <ClipboardList className="h-3 w-3 text-blue-500" /> Ordens de Produção Prioritárias
          </CardTitle>
          <Link to="/producao/op" className="text-[10px] uppercase font-bold text-primary hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-2 font-bold uppercase text-[10px] text-muted-foreground tracking-widest">OP</th>
                  <th className="p-2 font-bold uppercase text-[10px] text-muted-foreground tracking-widest">Prioridade</th>
                  <th className="p-2 font-bold uppercase text-[10px] text-muted-foreground tracking-widest">Status</th>
                  <th className="p-2 font-bold uppercase text-[10px] text-muted-foreground tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/10 transition-colors group">
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <Skeleton className="h-4 w-64 mx-auto mb-2" />
                       <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Sincronizando com Engenharia de Produto (Sprint 2)</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, subtext }: { label: string; value: string; icon: any; color?: string; subtext?: string }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-muted/60 bg-card/50 backdrop-blur-sm group overflow-hidden">
      <CardContent className="pt-6 relative">
        <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
           <Icon className="h-16 w-16" />
        </div>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest group-hover:text-primary transition-colors">{label}</div>
            <div className={`mt-2 text-2xl font-bold ${color || "text-foreground"}`}>{value}</div>
            {subtext && <div className="text-[9px] text-muted-foreground mt-1 font-medium">{subtext}</div>}
          </div>
          <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
             <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, count, icon: Icon, color }: { label: string; count: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-muted/40 hover:border-primary/20 hover:bg-primary/5 transition-all group">
       <div className={`p-2 rounded-lg ${color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="h-3 w-3" />
       </div>
       <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">{label}</span>
          <span className="text-sm font-bold">{count}</span>
       </div>
    </div>
  );
}
