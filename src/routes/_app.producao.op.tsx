import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/producao/op")({
  head: () => ({ meta: [{ title: "Ordens de Produção" }] }),
  component: OpList,
});

function OpList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["ops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_producao" as never)
        .select("id, numero, status, data_abertura, data_prevista, prioridade")
        .order("data_abertura", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; numero: number; status: string; data_abertura: string; data_prevista: string | null; prioridade: number }[];
    },
  });
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Ordens de Produção</h1>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>OP</TableHead><TableHead>Status</TableHead>
            <TableHead>Abertura</TableHead><TableHead>Previsto</TableHead>
            <TableHead>Prioridade</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow> :
             data.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma OP cadastrada. Crie um Pedido e confirme para gerar OPs automaticamente.</TableCell></TableRow> :
             data.map(op => (
               <TableRow key={op.id}>
                 <TableCell><Link to="/producao/op/$id" params={{ id: op.id }} className="font-mono font-semibold hover:underline">#{op.numero}</Link></TableCell>
                 <TableCell><Badge variant="outline" className="capitalize">{op.status.replace(/_/g," ")}</Badge></TableCell>
                 <TableCell>{new Date(op.data_abertura).toLocaleDateString("pt-BR")}</TableCell>
                 <TableCell>{op.data_prevista ? new Date(op.data_prevista).toLocaleDateString("pt-BR") : "-"}</TableCell>
                 <TableCell>{op.prioridade}</TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
