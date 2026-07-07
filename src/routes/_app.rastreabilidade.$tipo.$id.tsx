import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { coletar, labelDe, type NodeTipo } from "@/lib/rastreabilidade";
import { ArrowRight, Network } from "lucide-react";

export const Route = createFileRoute("/_app/rastreabilidade/$tipo/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Rastreabilidade" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Documento não encontrado.</div>,
  component: Page,
});

const TIPOS_VALIDOS: NodeTipo[] = [
  "pedido","op","nota_fiscal","cliente","fornecedor",
  "pedido_compra","recebimento","conta_pagar","conta_receber",
  "lote","movimento_estoque","movimento_financeiro","separacao","romaneio",
];

function Page() {
  const { tipo, id } = Route.useParams();
  const tipoOk = TIPOS_VALIDOS.includes(tipo as NodeTipo);
  const { data, isLoading } = useQuery({
    queryKey: ["rastro", tipo, id],
    enabled: tipoOk,
    queryFn: () => coletar(tipo as NodeTipo, id),
  });

  if (!tipoOk) return <div className="p-6 text-destructive">Tipo de documento inválido: {tipo}</div>;
  if (isLoading || !data) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data.centro) return <div className="p-6">Documento não encontrado.</div>;

  // Agrupa relacionados por tipo
  const grupos = data.relacionados.reduce<Record<string, typeof data.relacionados>>((acc, r) => {
    (acc[r.tipo] ??= []).push(r); return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Network className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Rastreabilidade</h1>
      </div>

      <Card className="border-primary">
        <CardHeader><CardTitle className="text-base">
          <Badge className="mr-2">{labelDe(data.centro.tipo)}</Badge>
          {data.centro.label}
        </CardTitle></CardHeader>
      </Card>

      {Object.keys(grupos).length === 0 && (
        <div className="text-muted-foreground text-sm">Nenhum vínculo encontrado — documento isolado.</div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(grupos).map(([t, itens]) => (
          <Card key={t}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">{labelDe(t as NodeTipo)} ({itens.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {itens.map(n => (
                <div key={`${n.tipo}-${n.id}`} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-0">
                  <span className="truncate">{n.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {n.route && (
                      <Link {...n.route} className="text-primary text-xs hover:underline">abrir</Link>
                    )}
                    <Link to="/rastreabilidade/$tipo/$id" params={{ tipo: n.tipo, id: n.id }} className="text-primary hover:underline">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
