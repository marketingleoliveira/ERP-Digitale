import { createFileRoute } from "@tanstack/react-router";
import { PreFaturamentoDashboard } from "@/components/faturamento/pre-faturamentos";

export const Route = createFileRoute("/fiscal/dashboard")({
  component: FiscalDashboardPage,
  head: () => ({
    title: "Dashboard Fiscal | ERP Digitale",
    meta: [
      { name: "description", content: "Visão geral do faturamento, impostos e pendências fiscais." },
      { property: "og:title", content: "Dashboard Fiscal | ERP Digitale" },
    ],
  }),
});

function FiscalDashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Fiscal</h1>
        <p className="text-muted-foreground">Controle de faturamento, impostos e conciliação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardStat title="Faturado (Mês)" value="R$ 0,00" color="text-green-600" />
        <CardStat title="Impostos (Mês)" value="R$ 0,00" color="text-red-600" />
        <CardStat title="Notas Rejeitadas" value="0" color="text-yellow-600" />
        <CardStat title="Expedições Pendentes" value="Calculando..." color="text-blue-600" />
      </div>

      <PreFaturamentoDashboard />
    </div>
  );
}

function CardStat({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
