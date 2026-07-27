import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Play, History, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  postProductionConsumption, 
  fetchOpApontamentos, 
  reverseProductionPosting,
  simulateProductionPosting 
} from "@/lib/op-apontamentos";
import { fetchMaterialReservations } from "@/lib/mrp-suggestions";

interface Props {
  opId: string;
  opNumero: number;
}

export function OpApontamentosSection({ opId, opNumero }: Props) {
  const [open, setOpen] = useState(false);
  const [qtdBoa, setQtdBoa] = useState<number>(0);
  const [qtdRefugo, setQtdRefugo] = useState<number>(0);
  const [etapa, setEtapa] = useState("Malharia");
  const [consumosInformados, setConsumosInformados] = useState<Record<string, number>>({});
  
  const queryClient = useQueryClient();

  const { data: reservas = [], isLoading: loadingReservas } = useQuery({
    queryKey: ["op-reservas", opId],
    queryFn: () => fetchMaterialReservations(opId),
  });

  const { data: apontamentos = [], isLoading: loadingApts } = useQuery({
    queryKey: ["op-apontamentos", opId],
    queryFn: () => fetchOpApontamentos(opId),
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => postProductionConsumption(payload),
    onSuccess: () => {
      toast.success("Apontamento registrado com sucesso!");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["op", opId] });
      queryClient.invalidateQueries({ queryKey: ["op-apontamentos", opId] });
      queryClient.invalidateQueries({ queryKey: ["op-reservas", opId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    }
  });

  const estornoMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => reverseProductionPosting(id, motivo),
    onSuccess: () => {
      toast.success("Apontamento estornado.");
      queryClient.invalidateQueries({ queryKey: ["op", opId] });
      queryClient.invalidateQueries({ queryKey: ["op-apontamentos", opId] });
    }
  });

  // Preencher consumos sugeridos quando abrir
  useEffect(() => {
    if (open && reservas.length > 0) {
      const suggested: Record<string, number> = {};
      reservas.forEach((r: any) => {
        if (r.status === 'ativa') {
          suggested[r.id] = Number(r.quantidade) - Number(r.quantidade_consumida || 0);
        }
      });
      setConsumosInformados(suggested);
    }
  }, [open, reservas]);

  const handlePost = () => {
    const consumos = reservas.map((r: any) => ({
      reserva_id: r.id,
      lote_id: r.lote_id,
      material_id: r.item_id,
      quantidade: consumosInformados[r.id] || 0
    })).filter(c => c.quantidade > 0);

    mutation.mutate({
      opId,
      quantidadeProduzida: qtdBoa,
      quantidadeRefugo: qtdRefugo,
      etapa,
      consumos
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Apontamentos e Consumos</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" /> Novo Apontamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Registrar Produção — OP #{opNumero}</DialogTitle>
              <DialogDescription>
                Informe a quantidade produzida e o consumo real dos materiais.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Quantidade Boa</Label>
                <Input type="number" value={qtdBoa} onChange={e => setQtdBoa(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Refugo / Perda Processo</Label>
                <Input type="number" value={qtdRefugo} onChange={e => setQtdRefugo(Number(e.target.value))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Etapa / Operação</Label>
                <Input value={etapa} onChange={e => setEtapa(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-bold">Consumo de Materiais (Baixa de Estoque)</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Lote Reservado</TableHead>
                    <TableHead className="text-right">Saldo Reserva</TableHead>
                    <TableHead className="w-32 text-right">Consumo Real</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservas.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        <div className="font-semibold">{r.item?.nome}</div>
                        <div className="text-muted-foreground">{r.item?.codigo}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.lote?.numero_lote || '—'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(r.quantidade) - Number(r.quantidade_consumida || 0)}
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-right font-mono"
                          value={consumosInformados[r.id] || 0}
                          onChange={e => setConsumosInformados(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {reservas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhuma reserva encontrada para esta OP.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handlePost} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Apontamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="historico" className="gap-2"><History className="h-4 w-4" /> Histórico</TabsTrigger>
          <TabsTrigger value="reservas" className="gap-2">Saldos Reservados</TabsTrigger>
        </TabsList>
        <TabsContent value="historico" className="border rounded-md p-0 mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Produzido</TableHead>
                <TableHead className="text-right">Refugo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apontamentos.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{new Date(a.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs">{a.etapa}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">{a.quantidade_produzida}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{a.quantidade_refugo}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'estornado' ? 'destructive' : 'outline'}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status !== 'estornado' && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          const m = prompt("Motivo do estorno:");
                          if (m) estornoMutation.mutate({ id: a.id, motivo: m });
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {apontamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm italic">
                    Nenhum apontamento realizado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="reservas" className="border rounded-md p-0 mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Reservado</TableHead>
                <TableHead className="text-right">Consumido</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-semibold">{r.item?.nome}</TableCell>
                  <TableCell className="text-right font-mono">{r.quantidade}</TableCell>
                  <TableCell className="text-right font-mono">{r.quantidade_consumida || 0}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {Number(r.quantidade) - Number(r.quantidade_consumida || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'consumida' ? 'secondary' : 'default'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
