import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/logistica/entregas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Rastreamento de Entregas" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type Ev = { id: string; data: string; evento: string; local: string | null; descricao: string | null; romaneio_id: string | null; romaneios: { numero: number; status: string } | null };

function Page() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["entrega-eventos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entrega_eventos").select("*, romaneios(numero,status)").order("data", { ascending: false }).limit(300);
      if (error) throw error;
      return data as Ev[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Rastreamento de Entregas</h1>
      <Card>
        <CardHeader><CardTitle>Eventos recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Romaneio</TableHead><TableHead>Evento</TableHead><TableHead>Local</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={5}>Carregando…</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground text-center">Sem eventos. Transicione um romaneio para gerar rastreio.</TableCell></TableRow> :
                data.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.data).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="font-mono">{e.romaneios ? `#${e.romaneios.numero}` : "—"}</TableCell>
                    <TableCell><Badge>{e.evento}</Badge></TableCell>
                    <TableCell>{e.local ?? "—"}</TableCell>
                    <TableCell>{e.descricao ?? "—"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
