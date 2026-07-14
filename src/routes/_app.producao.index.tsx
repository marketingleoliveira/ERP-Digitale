import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_COLS = [
  "planejada","programada","em_producao","parcial",
  "aguardando_qualidade","aprovada","pronta_estoque",
  "pronta_faturamento","faturada","expedida","encerrada",
] as const;

export const Route = createFileRoute("/_app/producao/")({
  head: () => ({ meta: [{ title: "Produção — Painel OP" }, { name: "description", content: "Kanban de Ordens de Produção" }] }),
  component: PainelOP,
});

function PainelOP() {
  const { data = [] } = useQuery({
    queryKey: ["op-kanban"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_producao" as never)
        .select("id, numero, status, data_prevista, prioridade").order("prioridade");
      if (error) throw error;
      return data as unknown as { id: string; numero: number; status: string; data_prevista: string | null; prioridade: number }[];
    },
  });
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">🏭 Painel de Ordens de Produção</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_COLS.map(s => {
          const ops = data.filter(o => o.status === s);
          return (
            <Card key={s} className="p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase capitalize">{s.replace(/_/g," ")}</span>
                <Badge variant="secondary">{ops.length}</Badge>
              </div>
              <div className="space-y-2">
                {ops.map(op => (
                  <Link key={op.id} to="/producao/op/$id" params={{ id: op.id }}
                    className="block p-2 rounded border bg-card hover:bg-accent text-sm">
                    <div className="font-mono font-semibold">OP #{op.numero}</div>
                    {op.data_prevista && <div className="text-xs text-muted-foreground">até {new Date(op.data_prevista).toLocaleDateString("pt-BR")}</div>}
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
