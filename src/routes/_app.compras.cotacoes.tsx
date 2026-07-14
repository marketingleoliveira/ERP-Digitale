import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/cotacoes")({ ssr: false, component: Page });

function Page() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["cotacoes"],
    queryFn: async () => {
      const { data, error } = await db("cotacoes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; status: string; created_at: string; prazo_resposta: string | null; solicitacao_id: string | null }[];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">💬 Cotações</h1>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["ID","Status","Prazo","Criada em","Ações"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            : data.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma cotação.</TableCell></TableRow>
            : data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.id.slice(0, 8)}</TableCell>
                <TableCell><Badge>{c.status}</Badge></TableCell>
                <TableCell>{c.prazo_resposta ?? "—"}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Link to="/compras/cotacoes/$id" params={{ id: c.id }}><Button size="sm" variant="ghost">Abrir</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
