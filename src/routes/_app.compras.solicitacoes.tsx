import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2 } from "lucide-react";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/solicitacoes")({ ssr: false, component: Page });

type S = { id: string; numero: number; setor: string | null; prioridade: string; status: string; created_at: string; necessidade_em: string | null };

function Page() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["solicitacoes_compra"],
    queryFn: async () => {
      const { data, error } = await db("solicitacoes_compra").select("*").order("numero", { ascending: false });
      if (error) throw error;
      return data as S[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">📋 Solicitações de Compra</h1>
        <Link to="/compras/solicitacoes/nova"><Button size="sm"><FilePlus2 className="h-4 w-4 mr-1.5" />Nova Solicitação</Button></Link>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Nº","Setor","Prioridade","Status","Necessidade","Criada em","Ações"].map((h) => (
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma solicitação.</TableCell></TableRow>
            ) : data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono">#{s.numero}</TableCell>
                <TableCell>{s.setor ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{s.prioridade}</Badge></TableCell>
                <TableCell><Badge>{s.status}</Badge></TableCell>
                <TableCell>{s.necessidade_em ?? "—"}</TableCell>
                <TableCell>{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Link to="/compras/solicitacoes/$id" params={{ id: s.id }}><Button size="sm" variant="ghost">Abrir</Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
