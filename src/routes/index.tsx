import { createFileRoute } from "@tanstack/react-router";
import { 
  BarChart3, 
  Factory, 
  AlertTriangle, 
  ClipboardList, 
  ShoppingCart, 
  Settings 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Executivo Industrial</h1>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Produção Realizada Hoje" value="1.240 kg" />
        <KpiCard label="Produção Planejada Hoje" value="1.350 kg" />
        <KpiCard label="Máquinas em Operação" value="12 / 15" />
        <KpiCard label="Ordens Atrasadas" value="3" color="text-red-500" />
      </div>

      {/* Seções do Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="h-4 w-4" /> Situação da Fábrica</CardTitle></CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground border rounded-lg m-4">
            Mapa visual da fábrica (em desenvolvimento)
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Alertas Operacionais</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-red-500"><AlertTriangle className="h-3 w-3" /> Atraso na OP #4021</li>
              <li className="flex items-center gap-2 text-yellow-500"><AlertTriangle className="h-3 w-3" /> Estoque crítico: Fio 20/1</li>
              <li className="flex items-center gap-2 text-blue-500"><AlertTriangle className="h-3 w-3" /> Qualidade pendente: OP #4010</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Ordens de Produção Prioritárias</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">Listagem de OPs (carregando dados reais...)</div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground uppercase">{label}</div>
        <div className={`mt-2 text-2xl font-bold ${color || "text-primary"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
