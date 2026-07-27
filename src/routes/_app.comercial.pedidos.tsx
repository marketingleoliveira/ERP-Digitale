import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { reserveOrderStock, shipOrder, simulateOrderReservation } from "@/lib/comercial.functions";
import { ShoppingBag, CheckCircle2, Truck, AlertCircle, Eye, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

export const Route = createFileRoute("/_app/comercial/pedidos")({
  component: PedidosPage,
});

function PedidosPage() {
  const queryClient = useQueryClient();
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["pedidos_venda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          customer:customers(razao_social)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const reserveMutation = useMutation({
    mutationFn: (pedidoId: string) => reserveOrderStock({ 
      data: { pedidoId, idempotencyKey: `res-${pedidoId}-${Date.now()}` } 
    }),
    onSuccess: () => {
      toast.success("Estoque reservado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pedidos_venda"] });
      queryClient.invalidateQueries({ queryKey: ["estoque_comercial"] });
    },
    onError: (err: any) => toast.error(`Erro ao reservar: ${err.message}`),
  });

  const shipMutation = useMutation({
    mutationFn: (pedidoId: string) => shipOrder({ data: { pedidoId } }),
    onSuccess: () => {
      toast.success("Pedido enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pedidos_venda"] });
      queryClient.invalidateQueries({ queryKey: ["estoque_comercial"] });
    },
    onError: (err: any) => toast.error(`Erro ao expedir: ${err.message}`),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "rascunho": return <Badge variant="secondary">Rascunho</Badge>;
      case "confirmado": return <Badge className="bg-blue-500">Confirmado</Badge>;
      case "reservado": return <Badge className="bg-amber-500">Reservado</Badge>;
      case "expedido": return <Badge className="bg-emerald-500">Expedido</Badge>;
      case "cancelado": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos de Venda</h1>
          <p className="text-muted-foreground">Gerencie reservas e fluxo de expedição.</p>
        </div>
        <Button>Novo Pedido</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Carregando...</TableCell>
                </TableRow>
              ) : pedidos?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.numero}</TableCell>
                  <TableCell>{(p.customer as any)?.razao_social || "Consumidor Final"}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">R$ {Number(p.valor_total).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {p.status === "confirmado" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-amber-600 border-amber-200 bg-amber-50"
                        onClick={() => reserveMutation.mutate(p.id)}
                        disabled={reserveMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Reservar
                      </Button>
                    )}
                    {p.status === "reservado" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-emerald-600 border-emerald-200 bg-emerald-50"
                        onClick={() => shipMutation.mutate(p.id)}
                        disabled={shipMutation.isPending}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Expedir
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPedido(p.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Pedido {p.numero}</DialogTitle>
                          <DialogDescription>
                            Simulação de reserva e itens do pedido.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedPedido === p.id && <PedidoDetails pedidoId={p.id} />}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PedidoDetails({ pedidoId }: { pedidoId: string }) {
  const fetchSimulation = useServerFn(simulateOrderReservation);
  const { data: simulation, isLoading } = useQuery({
    queryKey: ["simulacao_reserva", pedidoId],
    queryFn: () => fetchSimulation({ data: { pedidoId } }),
  });

  if (isLoading) return <div className="py-10 text-center">Simulando alocação de lotes...</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 bg-muted/50">
        <h3 className="font-semibold mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Plano de Reserva (FIFO)
        </h3>
        <p className="text-sm text-muted-foreground">
          O sistema sugere automaticamente os lotes mais antigos liberados comercialmente.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artigo</TableHead>
            <TableHead className="text-right">Solicitado</TableHead>
            <TableHead className="text-right">Atendido</TableHead>
            <TableHead>Lotes Alocados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {simulation?.map((s, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-medium">{s.artigo_id}</TableCell>
              <TableCell className="text-right">{s.quantidade_solicitada} kg</TableCell>
              <TableCell className="text-right font-bold text-emerald-600">
                {s.quantidade_atendida} kg
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {s.lotes_sugeridos.map(l => (
                    <Badge key={l.lote_id} variant="outline" className="text-[10px]">
                      {l.numero_lote} ({l.quantidade}kg)
                    </Badge>
                  ))}
                  {s.quantidade_atendida < s.quantidade_solicitada && (
                    <Badge variant="destructive" className="text-[10px]">
                      Falta {(s.quantidade_solicitada - s.quantidade_atendida).toFixed(2)}kg
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
