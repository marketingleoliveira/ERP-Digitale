import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/estoque-fios")({
  ssr: false,
  component: EstoqueFiosPage,
});

type Row = { id: string; codigo: string | null; nome: string | null };

async function fetchFios(): Promise<Row[]> {
  const { data, error } = await supabase
    .from("fios")
    .select("id, codigo, nome")
    .order("codigo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function EstoqueFiosPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["estoque-fios"], queryFn: fetchFios });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📦 Estoque — Fios</h1>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground font-semibold">Código</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Fio</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right w-32">Qtd. (KG)</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right w-32">Reservado</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right w-32">Disponível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum fio cadastrado.</TableCell></TableRow>
            ) : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-primary font-medium">{r.codigo ?? "—"}</TableCell>
                <TableCell>{r.nome ?? "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground">0,000</TableCell>
                <TableCell className="text-right text-muted-foreground">0,000</TableCell>
                <TableCell className="text-right text-muted-foreground">0,000</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">
        Movimentações de entrada/saída serão integradas quando os módulos de Compras e Ordens estiverem disponíveis.
      </p>
    </div>
  );
}
