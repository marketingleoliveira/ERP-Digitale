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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    op_id: "",
    artigo_id: "",
    servico_tipo: "Tinturaria",
    cor_solicitada: "",
    data_prevista: "",
    observacao: "",
  });

  const { data: fornecedores } = useQuery({
    queryKey: ["fornecedores-industrializacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("ordens_industrializacao")
        .insert([{
          ...formData,
          status: 'APROVADA', // Criando já aprovada para agilizar demo
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ordem de industrialização criada!");
      queryClient.invalidateQueries({ queryKey: ["industrialization-orders"] });
      onOpenChange(false);
      setFormData({
        fornecedor_id: "",
        op_id: "",
        artigo_id: "",
        servico_tipo: "Tinturaria",
        cor_solicitada: "",
        data_prevista: "",
        observacao: "",
      });
    },
    onError: (err: any) => {
      toast.error(`Erro ao criar ordem: ${err.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Industrialização</DialogTitle>
          <DialogDescription>
            Registre uma nova solicitação de beneficiamento externo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 grid-cols-2">
          <div className="grid gap-2">
            <Label>Fornecedor (Tinturaria/Terceiro)</Label>
            <Select 
              value={formData.fornecedor_id} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, fornecedor_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores?.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de Serviço</Label>
            <Select 
              value={formData.servico_tipo} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, servico_tipo: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tinturaria">Tinturaria</SelectItem>
                <SelectItem value="Estamparia">Estamparia</SelectItem>
                <SelectItem value="Acabamento">Acabamento</SelectItem>
                <SelectItem value="Revisão">Revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Artigo de Origem</Label>
            <Select 
              value={formData.artigo_id} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, artigo_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o artigo" />
              </SelectTrigger>
              <SelectContent>
                {artigos?.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.nome} ({a.codigo})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Cor Solicitada</Label>
            <Input 
              value={formData.cor_solicitada} 
              onChange={(e) => setFormData(prev => ({ ...prev, cor_solicitada: e.target.value }))}
              placeholder="Ex: Azul Marinho"
            />
          </div>

          <div className="grid gap-2">
            <Label>Previsão de Retorno</Label>
            <Input 
              type="date"
              value={formData.data_prevista} 
              onChange={(e) => setFormData(prev => ({ ...prev, data_prevista: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Input 
              value={formData.observacao} 
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Criar Ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
