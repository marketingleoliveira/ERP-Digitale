import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/recebimentos/$id")({ ssr: false, component: Page });

type RI = { id: string; pedido_item_id: string; quantidade_recebida: number; quantidade_aprovada: number; quantidade_rejeitada: number; motivo_divergencia: string | null; lote_fornecedor: string | null };
type PI = { id: string; descricao: string; unidade: string; quantidade: number };

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: rec } = useQuery({
    queryKey: ["rec", id],
    queryFn: async () => {
      const { data, error } = await db("recebimentos").select("*, pedidos_compra(numero, fornecedores(razao_social))").eq("id", id).single();
      if (error) throw error;
      return data as { id: string; numero: number; status: string; nota_fornecedor: string | null; valor_nota: number | null; data_recebimento: string; pedidos_compra: { numero: number; fornecedores: { razao_social: string } | null } | null };
    },
  });
  const { data: itens = [] } = useQuery({
    queryKey: ["ri", id],
    queryFn: async () => {
      const { data, error } = await db("recebimento_itens").select("*").eq("recebimento_id", id);
      if (error) throw error;
      return data as RI[];
    },
  });
  const { data: pedidoItens = [] } = useQuery({
    queryKey: ["ri-pi", id],
    enabled: itens.length > 0,
    queryFn: async () => {
      const ids = itens.map((i) => i.pedido_item_id);
      const { data, error } = await db("pedidos_compra_itens").select("id,descricao,unidade,quantidade").in("id", ids);
      if (error) throw error;
      return data as PI[];
    },
  });

  const upRI = useMutation({
    mutationFn: async ({ rid, patch }: { rid: string; patch: Partial<RI> }) => {
      const { error } = await db("recebimento_itens").update(patch).eq("id", rid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ri", id] }),
  });

  const conferir = useMutation({
    mutationFn: async () => {
      const { error } = await db("recebimentos").update({ status: "conferido" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Conferido! Lotes e contas a pagar gerados."); qc.invalidateQueries({ queryKey: ["rec", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!rec) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">📦 Recebimento #{rec.numero}</h1>
          <div className="text-sm text-muted-foreground">PC #{rec.pedidos_compra?.numero} · {rec.pedidos_compra?.fornecedores?.razao_social}</div>
        </div>
        {rec.status === "em_conferencia" && (
          <Button size="sm" onClick={() => conferir.mutate()} disabled={conferir.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />Concluir Conferência
          </Button>
        )}
      </div>

      <Card className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><div className="text-muted-foreground">Status</div><Badge>{rec.status}</Badge></div>
        <div><div className="text-muted-foreground">Nota</div><div>{rec.nota_fornecedor ?? "—"}</div></div>
        <div><div className="text-muted-foreground">Valor</div><div>{rec.valor_nota ? `R$ ${Number(rec.valor_nota).toFixed(2)}` : "—"}</div></div>
        <div><div className="text-muted-foreground">Data</div><div>{new Date(rec.data_recebimento).toLocaleDateString("pt-BR")}</div></div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-primary hover:bg-primary">
            {["Item","Qtd Pedido","Recebido","Aprovado","Rejeitado","Motivo","Lote Fornec."].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {itens.map((ri) => {
              const pi = pedidoItens.find((x) => x.id === ri.pedido_item_id);
              const editable = rec.status === "em_conferencia";
              return (
                <TableRow key={ri.id}>
                  <TableCell>{pi?.descricao ?? "—"}</TableCell>
                  <TableCell>{pi?.quantidade ?? "—"} {pi?.unidade}</TableCell>
                  <TableCell><Input className="w-24" type="number" step="0.001" disabled={!editable} defaultValue={ri.quantidade_recebida} onBlur={(e) => upRI.mutate({ rid: ri.id, patch: { quantidade_recebida: Number(e.target.value) } })} /></TableCell>
                  <TableCell><Input className="w-24" type="number" step="0.001" disabled={!editable} defaultValue={ri.quantidade_aprovada} onBlur={(e) => upRI.mutate({ rid: ri.id, patch: { quantidade_aprovada: Number(e.target.value) } })} /></TableCell>
                  <TableCell><Input className="w-24" type="number" step="0.001" disabled={!editable} defaultValue={ri.quantidade_rejeitada} onBlur={(e) => upRI.mutate({ rid: ri.id, patch: { quantidade_rejeitada: Number(e.target.value) } })} /></TableCell>
                  <TableCell><Input className="w-40" disabled={!editable} defaultValue={ri.motivo_divergencia ?? ""} onBlur={(e) => upRI.mutate({ rid: ri.id, patch: { motivo_divergencia: e.target.value } })} /></TableCell>
                  <TableCell><Input className="w-32" disabled={!editable} defaultValue={ri.lote_fornecedor ?? ""} onBlur={(e) => upRI.mutate({ rid: ri.id, patch: { lote_fornecedor: e.target.value } })} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
