import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpedicoesPendentes } from "@/lib/comercial.functions";
import { getNaturezasOperacao, simulateInvoice, createPreFaturamento } from "@/lib/faturamento.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Truck } from "lucide-react";

export function PreFaturamentoDashboard() {
  const queryClient = useQueryClient();
  const { data: expedicoes } = useSuspenseQuery({
    queryKey: ["expedicoes-pendentes"],
    queryFn: () => getExpedicoesPendentes(),
  });
  const { data: naturezas } = useSuspenseQuery({
    queryKey: ["naturezas-operacao"],
    queryFn: () => getNaturezasOperacao(),
  });

  const [selectedExp, setSelectedExp] = useState<any>(null);
  const [naturezaId, setNaturezaId] = useState<string>("");
  const [simulacao, setSimulacao] = useState<any>(null);
  const [loadingSim, setLoadingSim] = useState(false);

  const simulateMutation = useMutation({
    mutationFn: (data: { expedicaoId: string; naturezaId: string }) => simulateInvoice(data),
    onSuccess: (data) => setSimulacao(data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createPreFaturamento({ data }),
    onSuccess: () => {
      alert("Pré-faturamento criado com sucesso.");
      setSelectedExp(null);
      setSimulacao(null);
      queryClient.invalidateQueries({ queryKey: ["expedicoes-pendentes"] });
    },
  });

  const handleSimulate = async () => {
    if (!naturezaId) return;
    setLoadingSim(true);
    try {
      await simulateMutation.mutateAsync({ expedicaoId: selectedExp.id, naturezaId });
    } finally {
      setLoadingSim(false);
    }
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      expedicaoId: selectedExp.id,
      naturezaId,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Expedições Pendentes de Faturamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Status Logístico</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expedicoes.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-mono text-xs">{exp.id.slice(0, 8)}</TableCell>
                  <TableCell>{exp.pedido?.numero || "N/A"}</TableCell>
                  <TableCell>{exp.transportadora?.razao_social || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{exp.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setSelectedExp(exp)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Faturar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedExp} onOpenChange={() => setSelectedExp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preparar Faturamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Natureza de Operação</label>
              <Select onValueChange={setNaturezaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza" />
                </SelectTrigger>
                <SelectContent>
                  {naturezas.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.descricao} ({n.cfop_interno})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExp && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm"><strong>Destinatário:</strong> {selectedExp.customer?.razao_social}</p>
                <p className="text-sm"><strong>Volumes:</strong> {selectedExp.volumes}</p>
                <p className="text-sm"><strong>Peso:</strong> {selectedExp.peso_bruto} kg</p>
              </div>
            )}

            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={handleSimulate}
              disabled={!naturezaId || loadingSim}
            >
              {loadingSim && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simular Impostos
            </Button>

            {simulacao && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-medium text-sm">Resumo da Simulação</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Produtos: R$ {simulacao.valor_produtos.toFixed(2)}</div>
                  <div className="font-bold">Total: R$ {simulacao.valor_total.toFixed(2)}</div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>CFOP</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulacao.itens.map((it: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{it.descricao}</TableCell>
                        <TableCell>{it.quantidade} {it.unidade}</TableCell>
                        <TableCell>{it.cfop}</TableCell>
                        <TableCell>R$ {it.valor_total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExp(null)}>Cancelar</Button>
            <Button 
              onClick={handleCreate} 
              disabled={!simulacao || createMutation.isPending}
            >
              Confirmar Pré-faturamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
