import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, PackageCheck } from "lucide-react";

interface RetornoDialogProps {
  remessa: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RetornoDialog({ remessa, open, onOpenChange }: RetornoDialogProps) {
  const queryClient = useQueryClient();
  const [itensRetorno, setItensRetorno] = useState<Record<string, any>>({});
  const [docRef, setDocRef] = useState("");
  const [custoServico, setCustoServico] = useState(0);

  const { data: artigos } = useQuery({
    queryKey: ["artigos-industrializacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, nome, codigo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const receiveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(itensRetorno).map(([itemId, data]) => ({
        remessa_item_id: itemId,
        quantidade_recebida: data.quantidade_recebida || 0,
        quantidade_perdida: data.quantidade_perdida || 0,
        artigo_resultante_id: data.artigo_resultante_id,
        numero_lote_novo: data.numero_lote_novo,
      })).filter(i => i.quantidade_recebida > 0);

      if (payload.length === 0) throw new Error("Informe a quantidade recebida em ao menos um item.");
      if (payload.some(i => !i.artigo_resultante_id)) throw new Error("Selecione o artigo resultante para todos os itens retornados.");

      const { data, error } = await supabase.rpc('receive_external_processing_return', {
        p_remessa_id: remessa.id,
        p_itens_retorno: payload,
        p_documento_referencia: docRef,
        p_custo_servico: custoServico,
      } as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Retorno registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["industrialization-order"] });
      onOpenChange(false);
      setItensRetorno({});
      setDocRef("");
      setCustoServico(0);
    },
    onError: (err: any) => {
      toast.error(`Erro ao registrar retorno: ${err.message}`);
    },
  });

  const updateItem = (itemId: string, field: string, value: any) => {
    setItensRetorno(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { 
            quantidade_recebida: 0, 
            quantidade_perdida: 0, 
            artigo_resultante_id: "", 
            numero_lote_novo: "" 
        }),
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Registrar Retorno de Terceiro</DialogTitle>
          <DialogDescription>
            Informe as quantidades recebidas e os novos lotes gerados após o beneficiamento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docRef">NF de Retorno / Guia</Label>
              <Input
                id="docRef"
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                placeholder="Número do documento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo">Custo do Serviço (Total)</Label>
              <Input
                id="custo"
                type="number"
                value={custoServico}
                onChange={(e) => setCustoServico(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Lote Original</TableHead>
                  <TableHead>Qtd Enviada</TableHead>
                  <TableHead>Artigo Resultante</TableHead>
                  <TableHead>Qtd Recebida</TableHead>
                  <TableHead>Novo Lote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remessa?.itens?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.lote?.numero_lote}</TableCell>
                    <TableCell>{item.quantidade_enviada} kg</TableCell>
                    <TableCell>
                      <Select 
                        value={itensRetorno[item.id]?.artigo_resultante_id || ""}
                        onValueChange={(val) => updateItem(item.id, 'artigo_resultante_id', val)}
                      >
                        <SelectTrigger className="h-8 w-[200px]">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {artigos?.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={itensRetorno[item.id]?.quantidade_recebida || ""}
                        onChange={(e) => updateItem(item.id, 'quantidade_recebida', parseFloat(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-32 font-mono text-xs"
                        value={itensRetorno[item.id]?.numero_lote_novo || ""}
                        onChange={(e) => updateItem(item.id, 'numero_lote_novo', e.target.value)}
                        placeholder="Automático"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => receiveMutation.mutate()} 
            disabled={receiveMutation.isPending}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {receiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            Confirmar Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
