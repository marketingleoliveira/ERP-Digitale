import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardIndicadores } from "@/services/dashboard/indicadores.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, Receipt, Wallet, Timer } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard/industrial")({
  head: () => ({ meta: [{ title: "Dashboard Industrial" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: DashIndustrial,
});

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashIndustrial() {
  const fn = useServerFn(getDashboardIndicadores);
  const { data, isLoading } = useQuery({ queryKey: ["dash-industrial"], queryFn: () => fn() });

  if (isLoading || !data) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Industrial</h1>

      <section>
        <div className="mb-3 flex items-center gap-2"><Factory className="h-4 w-4" /><h2 className="font-semibold">Produção</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="OP abertas" value={data.producao.abertas} />
          <KpiCard label="Em produção" value={data.producao.em_producao} />
          <KpiCard label="Aguardando qualidade" value={data.producao.aguardando_qualidade} />
          <KpiCard label="Concluídas" value={data.producao.concluidas} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Receipt className="h-4 w-4" /><h2 className="font-semibold">Fiscal</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Pré-Faturamentos" value={data.fiscal.pre_faturamentos} />
          <KpiCard label="NF emitidas" value={data.fiscal.emitidas} />
          <KpiCard label="NF canceladas" value={data.fiscal.canceladas} />
          <KpiCard label="NF rejeitadas" value={data.fiscal.rejeitadas} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Wallet className="h-4 w-4" /><h2 className="font-semibold">Financeiro</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Valor faturado" value={fmtBRL(data.financeiro.valor_faturado)} />
          <KpiCard label="Recebimentos" value={fmtBRL(data.financeiro.recebimentos)} />
          <KpiCard label="Pendentes" value={fmtBRL(data.financeiro.pendentes)} />
          <KpiCard label="Fluxo líquido" value={fmtBRL(data.financeiro.fluxo)} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Timer className="h-4 w-4" /><h2 className="font-semibold">Tempos Médios (horas)</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Pedido → Produção" value={data.industrial.h_pedido_producao} />
          <KpiCard label="Produção → Faturamento" value={data.industrial.h_producao_faturamento} />
          <KpiCard label="Faturamento → Expedição" value={data.industrial.h_faturamento_expedicao} />
          <KpiCard label="Pedido → Entrega" value={data.industrial.h_pedido_entrega} />
        </div>
      </section>
    </div>
  );
}
