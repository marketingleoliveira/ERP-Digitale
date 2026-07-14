import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileText, CheckCircle2, XCircle, Ban, DollarSign, Loader2 } from "lucide-react";

const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

function Kpi({ icon: Icon, label, value, tone = "primary" }: { icon: typeof FileText; label: string; value: string; tone?: "primary" | "success" | "danger" | "warning" }) {
  const tones = {
    primary: "text-primary bg-primary/10",
    success: "text-emerald-600 bg-emerald-500/10",
    danger: "text-red-600 bg-red-500/10",
    warning: "text-amber-600 bg-amber-500/10",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`p-3 rounded-lg ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-primary">{value}</p>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["fiscal_dashboard"],
    queryFn: async () => {
      const { data: notas, error } = await supabase.from("notas_fiscais" as never)
        .select("id, valor_total, status_sefaz, data_emissao, base_icms, valor_icms, valor_ipi, valor_pis, valor_cofins")
        .gte("data_emissao", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10));
      if (error) throw error;
      return (notas ?? []) as unknown as Array<{
        valor_total: number; status_sefaz: string; data_emissao: string;
        valor_icms: number; valor_ipi: number; valor_pis: number; valor_cofins: number;
      }>;
    },
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;
  const notas = data ?? [];

  const emitidas = notas.filter(n => n.status_sefaz === "autorizada").length;
  const canceladas = notas.filter(n => n.status_sefaz === "cancelada").length;
  const rejeitadas = notas.filter(n => n.status_sefaz === "rejeitada").length;
  const faturado = notas.filter(n => n.status_sefaz === "autorizada").reduce((s, n) => s + Number(n.valor_total ?? 0), 0);
  const impostos = notas.reduce((s, n) => s + Number(n.valor_icms ?? 0) + Number(n.valor_ipi ?? 0) + Number(n.valor_pis ?? 0) + Number(n.valor_cofins ?? 0), 0);

  // Faturamento por dia (últimos 30)
  const porDia = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    porDia.set(d, 0);
  }
  notas.forEach(n => {
    const d = n.data_emissao?.slice(0, 10);
    if (porDia.has(d) && n.status_sefaz === "autorizada") porDia.set(d, (porDia.get(d) ?? 0) + Number(n.valor_total ?? 0));
  });
  const serie = Array.from(porDia.entries()).map(([d, v]) => ({ dia: d.slice(5), valor: v }));

  const pieData = [
    { name: "Autorizada", value: emitidas, color: "hsl(var(--primary))" },
    { name: "Cancelada", value: canceladas, color: "hsl(35 90% 55%)" },
    { name: "Rejeitada", value: rejeitadas, color: "hsl(0 70% 55%)" },
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📊 Dashboard Fiscal — últimos 90 dias</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={CheckCircle2} label="Autorizadas" value={String(emitidas)} tone="success" />
        <Kpi icon={Ban} label="Canceladas" value={String(canceladas)} tone="warning" />
        <Kpi icon={XCircle} label="Rejeitadas" value={String(rejeitadas)} tone="danger" />
        <Kpi icon={DollarSign} label="Faturado" value={money(faturado)} />
        <Kpi icon={FileText} label="Impostos" value={money(impostos)} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3 text-primary">Faturamento diário (30d)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serie}>
              <XAxis dataKey="dia" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-primary">Status</h3>
          {pieData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/fiscal/dashboard")({ component: Dashboard });
