import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/compras-db";
import { ShoppingCart, FileText, PackageCheck, Receipt, Handshake, Wallet, Truck } from "lucide-react";

export const Route = createFileRoute("/_app/compras/")({ ssr: false, component: Page });

function useCount(table: Parameters<typeof db>[0], status?: string) {
  return useQuery({
    queryKey: ["compras-count", table, status ?? ""],
    queryFn: async () => {
      let q = db(table).select("id", { count: "exact", head: true });
      if (status) q = q.eq("status", status);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function KPI({ label, value, href, icon: Icon }: { label: string; value: number | string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link to={href} className="block">
      <Card className="p-4 hover:border-primary transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-primary" />
          <div>
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Page() {
  const forn = useCount("fornecedores");
  const sc = useCount("solicitacoes_compra", "aprovada");
  const cot = useCount("cotacoes", "aberta");
  const pc = useCount("pedidos_compra", "enviado");
  const rec = useCount("recebimentos", "em_conferencia");
  const cp = useCount("contas_pagar", "aberta");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🛒 Compras — Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <KPI label="Fornecedores" value={forn.data ?? "…"} href="/compras/fornecedores" icon={Handshake} />
        <KPI label="Solicitações aprovadas" value={sc.data ?? "…"} href="/compras/solicitacoes" icon={FileText} />
        <KPI label="Cotações abertas" value={cot.data ?? "…"} href="/compras/cotacoes" icon={Receipt} />
        <KPI label="Pedidos enviados" value={pc.data ?? "…"} href="/compras/pedidos" icon={ShoppingCart} />
        <KPI label="Em conferência" value={rec.data ?? "…"} href="/compras/recebimentos" icon={PackageCheck} />
        <KPI label="Contas a pagar" value={cp.data ?? "…"} href="/compras/contas-pagar" icon={Wallet} />
      </div>
      <Card className="p-4">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><Truck className="h-4 w-4" /> Fluxo</h2>
        <div className="text-sm text-muted-foreground">
          Solicitação → Cotação → Pedido → Recebimento → Conferência → Estoque (lotes) → Contas a Pagar
        </div>
      </Card>
    </div>
  );
}
