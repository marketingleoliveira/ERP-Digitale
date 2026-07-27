import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, PackagePlus, AlertCircle, Info, RefreshCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  simulateProductionReceipt, 
  receiveProductionOutput 
} from "@/lib/op-entradas.functions";
import { SimulationResult } from "@/types/op-entradas";

interface Props {
  opId: string;
  opNumero: number | string;
  disabled?: boolean;
}

export function OpEntradaDialog({ opId, opNumero, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [deposito, setDeposito] = useState("Estoque Geral");
  const [classificacao, setClassificacao] = useState("PRODUTO-ACABADO");
  const [observacao, setObservacao] = useState("");
  
  const queryClient = useQueryClient();
  const simulateFn = useServerFn(simulateProductionReceipt);
  const receiveFn = useServerFn(receiveProductionOutput);

  const { data: simulacao, isLoading: loadingSim, refetch: refetchSim } = useQuery({
    queryKey: ["op-entrada-simulacao", opId, quantidade, classificacao],
    queryFn: () => simulateFn({ data: { opId, quantidadeEntrada: quantidade || 0.1, classificacao } }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => receiveFn({ data: payload }),
    onSuccess: (res: any) => {
      toast.success(`Entrada registrada! Lote: ${res.lote_numero}`);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["op", opId] });
      queryClient.invalidateQueries({ queryKey: ["op-rastreabilidade", opId] });
    },
    onError: (error: any) => {
      toast.error(`Erro na entrada: ${error.message}`);
    }
  });

  useEffect(() => {
    if (simulacao?.classificacao_sugerida && open) {
      setClassificacao(simulacao.classificacao_sugerida);
    }
  }, [simulacao?.classificacao_sugerida, open]);

  const handleConfirm = () => {
    if (quantidade <= 0) {
      toast.error("Informe a quantidade");
      return;
    }
    mutation.mutate({
      opId,
      quantidade,
      deposito,
      classificacao,
      observacao,
      idempotencyKey: crypto.randomUUID()
    });
  };

  const sim = simulacao as SimulationResult | undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <PackagePlus className="h-4 w-4" /> Entrada de Produção
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entrada de Produção — OP #{opNumero}</DialogTitle>
          <DialogDescription>
            Transforme a produção apontada em lotes rastreáveis no estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantidade para Entrada ({sim?.unidade || "un"})</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={quantidade} 
                  onChange={e => setQuantidade(Number(e.target.value))} 
                  placeholder="0.00"
                />
                <Button variant="ghost" size="icon" onClick={() => setQuantidade(sim?.saldo_elegivel || 0)} title="Usar saldo total">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Saldo elegível: <span className="font-bold text-primary">{sim?.saldo_elegivel || 0}</span> {sim?.unidade}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Classificação do Lote</Label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUTO-ACABADO">Produto Acabado</SelectItem>
                  <SelectItem value="PRODUTO-EM-PROCESSO">Produto em Processo</SelectItem>
                  <SelectItem value="MATERIA-PRIMA">Matéria-Prima</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Depósito / Localização</Label>
              <Select value={deposito} onValueChange={setDeposito}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estoque Geral">Estoque Geral</SelectItem>
                  <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                  <SelectItem value="Expedição">Expedição</SelectItem>
                  <SelectItem value="Quarentena">Quarentena / Qualidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg space-y-4 border">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Info className="h-4 w-4" /> Resumo da Simulação
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span>Artigo:</span>
                <span className="font-medium">{sim?.artigo || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Produção Aprovada:</span>
                <span className="font-medium">{sim?.quantidade_produzida || 0} {sim?.unidade}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Já Recebido:</span>
                <span className="font-medium">{sim?.quantidade_ja_recebida || 0} {sim?.unidade}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Custo Unit. Provisório:</span>
                <span className="font-bold text-primary">
                  {sim?.custo_unitario_provisorio 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sim.custo_unitario_provisorio)
                    : "R$ 0,00"}
                </span>
              </div>
            </div>

            {sim?.avisos && sim.avisos.length > 0 && (
              <Alert variant="destructive" className="py-2 px-3 scale-90 -mx-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-[10px]">
                  {sim.avisos.join(", ")}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Observações do Lote</Label>
            <Input value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: Rastreamento manual, defeitos, etc." />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={mutation.isPending || (sim?.saldo_elegivel || 0) <= 0 || quantidade > (sim?.saldo_elegivel || 0) + 0.001}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Entrada no Estoque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
