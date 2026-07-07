import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/recebimentos")({ ssr: false, component: Page });

function Page() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["recebimentos"],
    queryFn: async () => {
      const { data, error } = await db("recebimentos").select("*, pedidos_compra(numero, fornecedores(razao_social))").order("numero", { ascending: false });
      if (error) throw error;
      return data as { id: string; numero: number; status: string; nota_fornecedor: string | null; data_recebimento: string; pedidos_compra: { numero: number; fornecedores: { razao_social: string } | null } | null }[];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📦 Recebimentos</h1>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Nº","Pedido","Fornecedor","Nota","Data","Status","Ações"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            : data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum recebimento.</TableCell></TableRow>
            : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono">#{r.numero}</TableCell>
                <TableCell>PC #{r.pedidos_compra?.numero ?? "—"}</TableCell>
                <TableCell>{r.pedidos_compra?.fornecedores?.razao_social ?? "—"}</TableCell>
                <TableCell>{r.nota_fornecedor ?? "—"}</TableCell>
                <TableCell>{new Date(r.data_recebimento).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell><Link to="/compras/recebimentos/$id" params={{ id: r.id }}><Button size="sm" variant="ghost">Conferir</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
