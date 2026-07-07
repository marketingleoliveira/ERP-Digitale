/**
 * Detalhe da OP — cabeçalho + ações principais.
 * A Etapa 3b entrega o motor de Pré-Faturamento; timeline/apontamentos ficam
 * no roadmap 3c. O botão "Gerar Pré-Faturamento" só habilita quando a OP está
 * em `pronta_estoque` ou `pronta_faturamento`.
 */
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { OpFaturarDialog } from "@/components/producao/op-faturar-dialog";

export const Route = createFileRoute("/_app/producao/op/$id")({
  head: () => ({ meta: [{ title: "Detalhe da OP" }] }),
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">OP não encontrada.</div>,
  component: OpDetail,
});

function OpDetail() {
  const { id } = useParams({ from: "/_app/producao/op/$id" });

  const { data: op, isLoading } = useQuery({
    queryKey: ["op", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_producao")
        .select("id, numero, status, prioridade, data_abertura, data_prevista, observacao, pedido_id")
        .eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-24 w-full" /></div>;
  if (!op) return <div className="p-6">OP não encontrada.</div>;

  const faturavel = op.status === "pronta_estoque" || op.status === "pronta_faturamento";

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/producao/op"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">OP #{op.numero}</CardTitle>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{op.status}</Badge>
              <Badge variant="outline">Prioridade {op.prioridade}</Badge>
            </div>
          </div>
          <OpFaturarDialog opId={op.id} opNumero={op.numero} disabled={!faturavel} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Abertura</div>
            <div>{new Date(op.data_abertura).toLocaleString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Prevista</div>
            <div>{op.data_prevista ?? "—"}</div>
          </div>
          {op.observacao && (
            <div className="col-span-2">
              <div className="text-muted-foreground">Observação</div>
              <div>{op.observacao}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rastreabilidade</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Timeline, apontamentos, consumos, qualidade e entradas em estoque desta OP
          estão disponíveis via API (op_eventos / op_apontamentos / op_consumos /
          op_qualidade / op_entradas_estoque) — visualização em construção (Etapa 3c).
        </CardContent>
      </Card>
    </div>
  );
}
