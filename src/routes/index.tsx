import { createFileRoute } from "@tanstack/react-router";
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
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeDashboardData } from "@/services/dashboard/home.functions";

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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo Industrial</h1>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Atualizado em: {new Date().toLocaleTimeString("pt-BR")}
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
        <Card className="lg:col-span-2 shadow-sm border-muted/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
              <Factory className="h-4 w-4 text-blue-500" /> Situação da Fábrica
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

        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Alertas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {producao.ops_atrasadas > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-600 uppercase">Atraso Crítico</p>
                    <p className="text-xs text-red-500/80">{producao.ops_atrasadas} Ordens de Produção em atraso</p>
                  </div>
                </div>
              )}
              {financeiro.vencidos > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-yellow-600 uppercase">Pendência Financeira</p>
                    <p className="text-xs text-yellow-500/80">Contas vencidas detectadas</p>
                  </div>
                </div>
              )}
              {producao.ops_atrasadas === 0 && financeiro.vencidos === 0 && (
                <p className="text-center py-8 text-xs text-muted-foreground italic">Nenhum alerta crítico no momento.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
            <ClipboardList className="h-4 w-4 text-blue-500" /> Ordens de Produção Prioritárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-2 font-bold uppercase text-muted-foreground">OP</th>
                  <th className="p-2 font-bold uppercase text-muted-foreground">Prioridade</th>
                  <th className="p-2 font-bold uppercase text-muted-foreground">Status</th>
                  <th className="p-2 font-bold uppercase text-muted-foreground text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/10 transition-colors">
                  <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                    Dados em sincronização com o modelo industrial...
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
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-muted/60">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{label}</div>
            <div className={`mt-2 text-2xl font-bold ${color || "text-foreground"}`}>{value}</div>
            {subtext && <div className="text-[9px] text-muted-foreground mt-1">{subtext}</div>}
          </div>
          <div className="p-2 bg-muted rounded-lg">
             <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, count, icon: Icon, color }: { label: string; count: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-muted hover:bg-muted/20 transition-all">
       <div className={`p-2 rounded-md ${color} text-white`}>
          <Icon className="h-4 w-4" />
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight leading-none mb-1">{label}</span>
          <span className="text-sm font-bold">{count}</span>
       </div>
    </div>
  );
}

