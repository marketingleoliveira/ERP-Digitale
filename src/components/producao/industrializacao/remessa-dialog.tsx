import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shipMaterialToExternalProcessor } from "@/lib/op-industrializacao.functions";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";

interface RemessaDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemessaDialog({ order, open, onOpenChange }: RemessaDialogProps) {
  const queryClient = useQueryClient();
  const [selectedLotes, setSelectedLotes] = useState<Record<string, number>>({});
  const [docRef, setDocRef] = useState("");

  const { data: availableLotes, isLoading } = useQuery({
    queryKey: ["lotes-disponiveis-industrializacao", order.artigo_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("*")
        .eq("item_id", order.artigo_id)
        .gt("quantidade_disponivel", 0)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!order.artigo_id && open,
  });

  const shipMutation = useMutation({
    mutationFn: async () => {
      const lotesToShip = Object.entries(selectedLotes)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ lote_id: id, quantidade: qty }));

      if (lotesToShip.length === 0) throw new Error("Selecione ao menos um lote para remessa.");

      return shipMaterialToExternalProcessor({
        data: {
          ordemId: order.id,
          lotes: lotesToShip,
          documentoReferencia: docRef,
        }
      });
    },
    onSuccess: () => {
      toast.success("Remessa registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["industrialization-order", order.id] });
      onOpenChange(false);
      setSelectedLotes({});
      setDocRef("");
    },
    onError: (err: any) => {
      toast.error(`Erro ao registrar remessa: ${err.message}`);
    },
  });

  const toggleLote = (lote: any, checked: boolean) => {
    setSelectedLotes(prev => {
      const next = { ...prev };
      if (checked) {
        next[lote.id] = lote.quantidade_disponivel;
      } else {
        delete next[lote.id];
      }
      return next;
    });
  };

  const updateQty = (loteId: string, qty: number, max: number) => {
    setSelectedLotes(prev => ({
      ...prev,
      [loteId]: Math.min(qty, max)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar Remessa para Terceiro</DialogTitle>
          <DialogDescription>
            Selecione os lotes de material que serão enviados para {(order.fornecedor as any)?.razao_social}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="docRef" className="text-right">NF de Remessa</Label>
            <Input
              id="docRef"
              value={docRef}
              onChange={(e) => setDocRef(e.target.value)}
              placeholder="Número da nota fiscal"
              className="col-span-3"
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Número do Lote</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Disponível</TableHead>
                  <TableHead className="w-[150px]">Qtd Enviar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : availableLotes?.map((lote) => (
                  <TableRow key={lote.id}>
                    <TableCell>
                      <Checkbox
                        checked={!!selectedLotes[lote.id]}
                        onCheckedChange={(checked) => toggleLote(lote, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{lote.numero_lote}</TableCell>
                    <TableCell>{lote.cor_id || '-'}</TableCell>
                    <TableCell>{lote.quantidade_disponivel} {lote.unidade || 'kg'}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        disabled={!selectedLotes[lote.id]}
                        value={selectedLotes[lote.id] || ""}
                        onChange={(e) => updateQty(lote.id, parseFloat(e.target.value), lote.quantidade_disponivel)}
                        className="h-8"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {availableLotes?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">
                      Nenhum lote disponível para este artigo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => shipMutation.mutate()} 
            disabled={shipMutation.isPending || Object.keys(selectedLotes).length === 0}
            className="gap-2"
          >
            {shipMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Confirmar Remessa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
