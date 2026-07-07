import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/pedidos")({ ssr: false, component: Page });

function Page() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["pedidos_compra"],
    queryFn: async () => {
      const { data, error } = await db("pedidos_compra").select("*, fornecedores(razao_social)").order("numero", { ascending: false });
      if (error) throw error;
      return data as { id: string; numero: number; status: string; valor_total: number; created_at: string; prazo_entrega: string | null; fornecedores: { razao_social: string } | null }[];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🛒 Pedidos de Compra</h1>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Nº","Fornecedor","Status","Valor","Prazo","Criado","Ações"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            : data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido.</TableCell></TableRow>
            : data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">#{p.numero}</TableCell>
                <TableCell>{p.fornecedores?.razao_social ?? "—"}</TableCell>
                <TableCell><Badge>{p.status}</Badge></TableCell>
                <TableCell>R$ {Number(p.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>{p.prazo_entrega ?? "—"}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Link to="/compras/pedidos/$id" params={{ id: p.id }}><Button size="sm" variant="ghost">Abrir</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
