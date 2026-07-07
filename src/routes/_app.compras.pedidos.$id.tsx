import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, CheckCircle2, XCircle, Plus, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/pedidos/$id")({ ssr: false, component: Page });

type P = { id: string; numero: number; status: string; valor_total: number; condicao_pagamento: string | null; prazo_entrega: string | null; frete: number; desconto: number; fornecedor_id: string; fornecedores: { razao_social: string } | null };
type Item = { id: string; descricao: string; quantidade: number; quantidade_recebida: number; unidade: string; preco_unitario: number; ncm: string | null; cfop: string | null; subtotal: number };

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: p } = useQuery({
    queryKey: ["pc", id],
    queryFn: async () => {
      const { data, error } = await db("pedidos_compra").select("*, fornecedores(razao_social)").eq("id", id).single();
      if (error) throw error;
      return data as P;
    },
  });
  const { data: itens = [] } = useQuery({
    queryKey: ["pci", id],
    queryFn: async () => {
      const { data, error } = await db("pedidos_compra_itens").select("*").eq("pedido_id", id);
      if (error) throw error;
      return data as Item[];
    },
  });

  const [newItem, setNewItem] = useState({ descricao: "", quantidade: 1, unidade: "un", preco_unitario: 0 });
  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await db("pedidos_compra_itens").insert({ ...newItem, pedido_id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Item adicionado."); setNewItem({ descricao: "", quantidade: 1, unidade: "un", preco_unitario: 0 }); qc.invalidateQueries({ queryKey: ["pci", id] }); },
  });
  const rmItem = useMutation({
    mutationFn: async (iid: string) => {
      const { error } = await db("pedidos_compra_itens").delete().eq("id", iid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pci", id] }),
  });
  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const patch: Record<string, unknown> = { status };
      if (status === "enviado") patch.enviado_em = new Date().toISOString();
      if (status === "confirmado") patch.confirmado_em = new Date().toISOString();
      const { error } = await db("pedidos_compra").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado."); qc.invalidateQueries({ queryKey: ["pc", id] }); },
  });

  const criarRec = () => nav({ to: "/compras/recebimentos/novo", search: { pedido: id } });

  if (!p) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;
  const total = itens.reduce((s, i) => s + Number(i.subtotal ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">🛒 Pedido de Compra #{p.numero}</h1>
          <div className="text-sm text-muted-foreground">{p.fornecedores?.razao_social}</div>
        </div>
        <div className="flex gap-2">
          {p.status === "rascunho" && <Button size="sm" onClick={() => setStatus.mutate("enviado")}><Send className="h-4 w-4 mr-1.5" />Enviar</Button>}
          {p.status === "enviado" && <Button size="sm" onClick={() => setStatus.mutate("confirmado")}><CheckCircle2 className="h-4 w-4 mr-1.5" />Confirmar</Button>}
          {["confirmado","parcial"].includes(p.status) && <Button size="sm" onClick={criarRec}><PackagePlus className="h-4 w-4 mr-1.5" />Novo Recebimento</Button>}
          {["rascunho","enviado"].includes(p.status) && <Button size="sm" variant="outline" onClick={() => setStatus.mutate("cancelado")}><XCircle className="h-4 w-4 mr-1.5" />Cancelar</Button>}
        </div>
      </div>

      <Card className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><div className="text-muted-foreground">Status</div><Badge>{p.status}</Badge></div>
        <div><div className="text-muted-foreground">Cond. Pag.</div><div>{p.condicao_pagamento ?? "—"}</div></div>
        <div><div className="text-muted-foreground">Prazo</div><div>{p.prazo_entrega ?? "—"}</div></div>
        <div><div className="text-muted-foreground">Total</div><div className="font-semibold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-primary hover:bg-primary">
            {["Descrição","Qtd","Recebido","Un","Preço","NCM","CFOP","Subtotal",""].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {itens.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.descricao}</TableCell>
                <TableCell>{i.quantidade}</TableCell>
                <TableCell>{i.quantidade_recebida}</TableCell>
                <TableCell>{i.unidade}</TableCell>
                <TableCell>R$ {Number(i.preco_unitario).toFixed(4)}</TableCell>
                <TableCell>{i.ncm ?? "—"}</TableCell>
                <TableCell>{i.cfop ?? "—"}</TableCell>
                <TableCell>R$ {Number(i.subtotal ?? 0).toFixed(2)}</TableCell>
                <TableCell>{p.status === "rascunho" && <Button size="sm" variant="ghost" onClick={() => rmItem.mutate(i.id)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
            {p.status === "rascunho" && (
              <TableRow>
                <TableCell><Input placeholder="Descrição" value={newItem.descricao} onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })} /></TableCell>
                <TableCell><Input type="number" step="0.001" className="w-24" value={newItem.quantidade} onChange={(e) => setNewItem({ ...newItem, quantidade: Number(e.target.value) })} /></TableCell>
                <TableCell>—</TableCell>
                <TableCell><Input className="w-20" value={newItem.unidade} onChange={(e) => setNewItem({ ...newItem, unidade: e.target.value })} /></TableCell>
                <TableCell><Input type="number" step="0.0001" className="w-24" value={newItem.preco_unitario} onChange={(e) => setNewItem({ ...newItem, preco_unitario: Number(e.target.value) })} /></TableCell>
                <TableCell colSpan={3} />
                <TableCell><Button size="sm" onClick={() => addItem.mutate()} disabled={!newItem.descricao}><Plus className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
