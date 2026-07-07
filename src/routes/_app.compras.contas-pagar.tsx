import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/contas-pagar")({ ssr: false, component: Page });

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["contas_pagar"],
    queryFn: async () => {
      const { data, error } = await db("contas_pagar").select("*, fornecedores(razao_social)").order("vencimento");
      if (error) throw error;
      return data as { id: string; descricao: string; parcela: number; total_parcelas: number; valor: number; vencimento: string; status: string; fornecedores: { razao_social: string } | null }[];
    },
  });

  const pagar = useMutation({
    mutationFn: async (row: { id: string; valor: number }) => {
      const { error } = await db("contas_pagar").update({ status: "paga", pago_em: new Date().toISOString(), valor_pago: row.valor }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Baixa realizada."); qc.invalidateQueries({ queryKey: ["contas_pagar"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = data.filter((r) => r.status === "aberta").reduce((s, r) => s + Number(r.valor), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">💰 Contas a Pagar</h1>
        <div className="text-sm">Total em aberto: <span className="font-semibold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Fornecedor","Descrição","Parcela","Vencimento","Valor","Status","Ações"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            : data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma conta.</TableCell></TableRow>
            : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.fornecedores?.razao_social ?? "—"}</TableCell>
                <TableCell>{r.descricao}</TableCell>
                <TableCell>{r.parcela}/{r.total_parcelas}</TableCell>
                <TableCell>{new Date(r.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>R$ {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell>
                  {r.status === "aberta" && <Button size="sm" onClick={() => pagar.mutate({ id: r.id, valor: r.valor })}><DollarSign className="h-4 w-4 mr-1.5" />Baixar</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
