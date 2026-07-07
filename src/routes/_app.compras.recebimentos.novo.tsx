import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ pedido: z.string().optional() });

export const Route = createFileRoute("/_app/compras/recebimentos/novo")({
  ssr: false,
  validateSearch: searchSchema,
  component: Page,
});

function Page() {
  const { pedido } = Route.useSearch();
  const nav = useNavigate();
  const [pedidoId, setPedidoId] = useState(pedido ?? "");
  const [nota, setNota] = useState("");
  const [chave, setChave] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [transportadora, setTransportadora] = useState("");
  const [valorNota, setValorNota] = useState<number | "">("");

  const { data: itens = [] } = useQuery({
    queryKey: ["pci-para-rec", pedidoId],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await db("pedidos_compra_itens").select("*").eq("pedido_id", pedidoId);
      if (error) throw error;
      return data as { id: string; descricao: string; quantidade: number; quantidade_recebida: number; unidade: string }[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (!pedidoId) throw new Error("Pedido obrigatório");
      const { data: user } = await supabase.auth.getUser();
      const { data: rec, error } = await db("recebimentos").insert({
        pedido_id: pedidoId,
        nota_fornecedor: nota || null,
        chave_nfe: chave || null,
        data_recebimento: data,
        transportadora: transportadora || null,
        valor_nota: valorNota === "" ? null : Number(valorNota),
        recebedor_id: user.user?.id,
        status: "em_conferencia",
      }).select().single();
      if (error) throw error;
      const rid = (rec as { id: string }).id;
      if (itens.length) {
        const { error: e2 } = await db("recebimento_itens").insert(
          itens.map((i) => ({
            recebimento_id: rid,
            pedido_item_id: i.id,
            quantidade_recebida: Math.max(0, i.quantidade - i.quantidade_recebida),
            quantidade_aprovada: 0,
            quantidade_rejeitada: 0,
          }))
        );
        if (e2) throw e2;
      }
      return rid;
    },
    onSuccess: (rid) => { toast.success("Recebimento criado."); nav({ to: "/compras/recebimentos/$id", params: { id: rid } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📦 Novo Recebimento</h1>
      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-3"><Label>Pedido de Compra (ID)</Label><Input value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} placeholder="Cole o ID do pedido" /></div>
        <div><Label>Nº da Nota do Fornecedor</Label><Input value={nota} onChange={(e) => setNota(e.target.value)} /></div>
        <div><Label>Chave NF-e</Label><Input value={chave} onChange={(e) => setChave(e.target.value)} /></div>
        <div><Label>Data Recebimento</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div><Label>Transportadora</Label><Input value={transportadora} onChange={(e) => setTransportadora(e.target.value)} /></div>
        <div><Label>Valor da Nota</Label><Input type="number" step="0.01" value={valorNota} onChange={(e) => setValorNota(e.target.value === "" ? "" : Number(e.target.value))} /></div>
      </Card>
      {pedidoId && (
        <Card className="p-4 text-sm text-muted-foreground">
          {itens.length} item(ns) pendente(s) serão criados para conferência.
        </Card>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => nav({ to: "/compras/recebimentos" })}>Cancelar</Button>
        <Button onClick={() => criar.mutate()} disabled={criar.isPending || !pedidoId}>{criar.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Criar</Button>
      </div>
    </div>
  );
}
