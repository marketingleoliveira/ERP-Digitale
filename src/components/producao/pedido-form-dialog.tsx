import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { criarPedido } from "@/services/producao/pedido.functions";

type ItemLinha = {
  descricao: string;
  product_id: string | null;
  variante_id: string | null;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
};

const linhaVazia = (): ItemLinha => ({
  descricao: "", product_id: null, variante_id: null,
  quantidade: 1, unidade: "UN", valor_unitario: 0,
});

interface Props {
  trigger?: React.ReactNode;
}

export function PedidoFormDialog({ trigger }: Props) {
  const qc = useQueryClient();
  const criar = useServerFn(criarPedido);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [numero, setNumero] = useState("");
  const [clienteId, setClienteId] = useState<string>("");
  const [vendedorId, setVendedorId] = useState<string>("");
  const [prazo, setPrazo] = useState<string>("");
  const [condicao, setCondicao] = useState<string>("30");
  const [observacao, setObservacao] = useState<string>("");
  const [itens, setItens] = useState<ItemLinha[]>([linhaVazia()]);

  const { data: clientes = [] } = useQuery({
    queryKey: ["customers-lite"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("customers")
        .select("id, razao_social, nome_fantasia").eq("status","ativo").order("razao_social").limit(500);
      return (data ?? []) as { id: string; razao_social: string; nome_fantasia: string | null }[];
    },
  });
  const { data: vendedores = [] } = useQuery({
    queryKey: ["sales-reps-lite"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("sales_reps").select("id, nome").eq("ativo", true).order("nome");
      return (data ?? []) as { id: string; nome: string }[];
    },
  });
  const { data: produtos = [] } = useQuery({
    queryKey: ["products-lite"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, nome").order("nome").limit(500);
      return (data ?? []) as { id: string; nome: string }[];
    },
  });

  useEffect(() => {
    if (open && !numero) {
      const stamp = new Date();
      setNumero(`PV${stamp.getFullYear().toString().slice(-2)}${String(stamp.getMonth()+1).padStart(2,"0")}${String(stamp.getDate()).padStart(2,"0")}${String(stamp.getHours()).padStart(2,"0")}${String(stamp.getMinutes()).padStart(2,"0")}`);
    }
  }, [open, numero]);

  const total = itens.reduce((s, it) => s + Number(it.quantidade || 0) * Number(it.valor_unitario || 0), 0);

  const patchItem = (i: number, patch: Partial<ItemLinha>) => {
    setItens(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  };

  const handleSubmit = async () => {
    if (!clienteId) { toast.error("Selecione o cliente."); return; }
    const itensValidos = itens.filter(it => it.quantidade > 0 && (it.descricao || it.product_id));
    if (itensValidos.length === 0) { toast.error("Adicione ao menos um item válido."); return; }
    setSaving(true);
    try {
      await criar({ data: {
        numero, cliente_id: clienteId, vendedor_id: vendedorId || null,
        prazo_entrega: prazo || null, condicao_pagamento: condicao, observacao,
        itens: itensValidos.map(it => ({
          descricao: it.descricao || null,
          product_id: it.product_id, variante_id: it.variante_id,
          quantidade: Number(it.quantidade), unidade: it.unidade,
          valor_unitario: Number(it.valor_unitario),
        })),
      } });
      toast.success("Pedido criado.");
      qc.invalidateQueries({ queryKey: ["pedidos-list"] });
      setOpen(false);
      // reset
      setNumero(""); setClienteId(""); setVendedorId(""); setPrazo(""); setObservacao("");
      setItens([linhaVazia()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar pedido.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="h-4 w-4 mr-1.5" />Novo pedido</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Pedido de Venda</DialogTitle></DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label>Número</Label><Input value={numero} onChange={e=>setNumero(e.target.value)} /></div>
          <div>
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Representante</Label>
            <Select value={vendedorId} onValueChange={setVendedorId}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Prazo de entrega</Label><Input type="date" value={prazo} onChange={e=>setPrazo(e.target.value)} /></div>
          <div><Label>Condição de pagamento</Label><Input value={condicao} onChange={e=>setCondicao(e.target.value)} placeholder="30/60/90" /></div>
          <div className="md:col-span-3"><Label>Observação</Label><Textarea rows={2} value={observacao} onChange={e=>setObservacao(e.target.value)} /></div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Itens</h3>
            <Button size="sm" variant="outline" onClick={()=>setItens(p=>[...p, linhaVazia()])}>
              <Plus className="h-3.5 w-3.5 mr-1"/>Item
            </Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Produto</TableHead><TableHead>Descrição</TableHead>
              <TableHead className="w-20">Qtd</TableHead><TableHead className="w-16">Un</TableHead>
              <TableHead className="w-28">Vl unit</TableHead><TableHead className="w-28 text-right">Total</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {itens.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Select value={it.product_id ?? ""} onValueChange={v => patchItem(i, { product_id: v || null })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-8" value={it.descricao} onChange={e=>patchItem(i,{descricao:e.target.value})} /></TableCell>
                  <TableCell><Input className="h-8" type="number" step="0.01" value={it.quantidade} onChange={e=>patchItem(i,{quantidade:Number(e.target.value)})} /></TableCell>
                  <TableCell><Input className="h-8" value={it.unidade} onChange={e=>patchItem(i,{unidade:e.target.value})} /></TableCell>
                  <TableCell><Input className="h-8" type="number" step="0.01" value={it.valor_unitario} onChange={e=>patchItem(i,{valor_unitario:Number(e.target.value)})} /></TableCell>
                  <TableCell className="text-right font-mono">
                    {(Number(it.quantidade||0)*Number(it.valor_unitario||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={()=>setItens(p=>p.filter((_,idx)=>idx!==i))} disabled={itens.length===1}>
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 text-right">
            <span className="text-sm text-muted-foreground mr-2">Total:</span>
            <span className="font-semibold text-lg">{total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={()=>setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin"/>}Salvar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
