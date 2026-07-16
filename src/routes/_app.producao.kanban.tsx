import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/producao/kanban")({ ssr: false, component: KanbanPage });

type OP = {
  id: string; numero: number; status: string; prioridade: number;
  data_prevista: string | null; observacao: string | null; pedido_id: string | null;
};

// Colunas simplificadas para visão executiva
const COLS: { key: string; label: string; from: string[]; next?: string; prev?: string }[] = [
  { key: "planejada", label: "Planejada", from: ["planejada"], next: "programada" },
  { key: "programada", label: "Programada", from: ["programada"], next: "em_producao", prev: "planejada" },
  { key: "em_producao", label: "Em Produção", from: ["em_producao"], next: "aguardando_qualidade", prev: "programada" },
  { key: "qualidade", label: "Qualidade", from: ["aguardando_qualidade", "aprovada", "reprovada"], next: "pronta_estoque", prev: "em_producao" },
  { key: "pronta", label: "Pronta / Estoque", from: ["pronta_estoque", "pronta_faturamento"], next: "faturada" },
  { key: "encerrada", label: "Faturada / Encerrada", from: ["faturada", "encerrada", "expedida"] },
];

function KanbanPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["kanban-ops"],
    queryFn: async (): Promise<OP[]> => {
      const { data, error } = await supabase.from("ordens_producao").select("id, numero, status, prioridade, data_prevista, observacao, pedido_id").neq("status", "cancelada").order("prioridade").limit(500);
      if (error) throw error;
      return (data ?? []) as OP[];
    },
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ordens_producao").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status atualizado."); qc.invalidateQueries({ queryKey: ["kanban-ops"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const byCol = useMemo(() => {
    const m = new Map<string, OP[]>();
    for (const c of COLS) m.set(c.key, []);
    for (const op of data) {
      const col = COLS.find((c) => c.from.includes(op.status));
      if (col) m.get(col.key)!.push(op);
    }
    return m;
  }, [data]);

  return (
    <div className="p-6">
      <PageHeader title="Kanban de Ordens de Produção" description="Fluxo visual do ciclo de vida das OPs." />
      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {COLS.map((col) => {
            const items = byCol.get(col.key) ?? [];
            return (
              <div key={col.key} className="flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{col.label}</div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2 flex-1 min-h-[100px] bg-muted/30 rounded p-2">
                  {items.map((op) => (
                    <Card key={op.id} className="p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">OP #{op.numero}</div>
                        <Badge variant={op.prioridade <= 3 ? "destructive" : op.prioridade <= 6 ? "default" : "secondary"} className="text-[10px]">P{op.prioridade}</Badge>
                      </div>
                      {op.data_prevista && <div className="text-muted-foreground">Prev: {new Date(op.data_prevista).toLocaleDateString("pt-BR")}</div>}
                      {op.observacao && <div className="text-muted-foreground truncate">{op.observacao}</div>}
                      <div className="flex justify-between mt-2 gap-1">
                        {col.prev && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => moveMut.mutate({ id: op.id, status: col.prev! })}><ArrowLeft className="h-3 w-3" /></Button>}
                        <div className="flex-1" />
                        {col.next && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => moveMut.mutate({ id: op.id, status: col.next! })}><ArrowRight className="h-3 w-3" /></Button>}
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">vazio</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}