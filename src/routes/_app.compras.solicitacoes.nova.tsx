import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/compras/solicitacoes/nova")({ ssr: false, component: Page });

type Item = { descricao: string; quantidade: number; unidade: string; observacao?: string };

function Page() {
  const nav = useNavigate();
  const [setor, setSetor] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [justificativa, setJustificativa] = useState("");
  const [necessidade, setNecessidade] = useState("");
  const [itens, setItens] = useState<Item[]>([{ descricao: "", quantidade: 1, unidade: "un" }]);

  const addItem = () => setItens((s) => [...s, { descricao: "", quantidade: 1, unidade: "un" }]);
  const rmItem = (i: number) => setItens((s) => s.filter((_, idx) => idx !== i));
  const upItem = (i: number, patch: Partial<Item>) => setItens((s) => s.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const criar = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: sc, error } = await db("solicitacoes_compra").insert({
        solicitante_id: user.user?.id,
        setor, prioridade, justificativa,
        necessidade_em: necessidade || null,
        status: "rascunho",
      }).select().single();
      if (error) throw error;
      const validos = itens.filter((i) => i.descricao && i.quantidade > 0);
      if (validos.length) {
        const { error: e2 } = await db("solicitacoes_compra_itens").insert(
          validos.map((it) => ({ ...it, solicitacao_id: (sc as { id: string }).id }))
        );
        if (e2) throw e2;
      }
      return (sc as { id: string }).id;
    },
    onSuccess: (id) => { toast.success("Solicitação criada."); nav({ to: "/compras/solicitacoes/$id", params: { id } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📋 Nova Solicitação de Compra</h1>
      <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><Label>Setor</Label><Input value={setor} onChange={(e) => setSetor(e.target.value)} /></div>
        <div>
          <Label>Prioridade</Label>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["baixa","normal","alta","urgente"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Necessidade em</Label><Input type="date" value={necessidade} onChange={(e) => setNecessidade(e.target.value)} /></div>
        <div className="md:col-span-4"><Label>Justificativa</Label><Textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} /></div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-3 flex items-center justify-between">
          <div className="font-semibold">Itens</div>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1.5" />Item</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Descrição","Quantidade","Unidade","Observação",""].map((h) => (
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((it, i) => (
              <TableRow key={i}>
                <TableCell><Input value={it.descricao} onChange={(e) => upItem(i, { descricao: e.target.value })} /></TableCell>
                <TableCell className="w-32"><Input type="number" step="0.001" value={it.quantidade} onChange={(e) => upItem(i, { quantidade: Number(e.target.value) })} /></TableCell>
                <TableCell className="w-24"><Input value={it.unidade} onChange={(e) => upItem(i, { unidade: e.target.value })} /></TableCell>
                <TableCell><Input value={it.observacao ?? ""} onChange={(e) => upItem(i, { observacao: e.target.value })} /></TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => rmItem(i)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => nav({ to: "/compras/solicitacoes" })}>Cancelar</Button>
        <Button onClick={() => criar.mutate()} disabled={criar.isPending}>{criar.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Criar Solicitação</Button>
      </div>
    </div>
  );
}
