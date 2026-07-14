import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trophy, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/cotacoes/$id")({ ssr: false, component: Page });

type CF = { id: string; fornecedor_id: string; condicao_pagamento: string | null; prazo_entrega_dias: number | null; frete: number; desconto: number; total: number; escolhida: boolean };
type Forn = { id: string; razao_social: string };

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: cot } = useQuery({
    queryKey: ["cot", id],
    queryFn: async () => {
      const { data, error } = await db("cotacoes").select("*").eq("id", id).single();
      if (error) throw error;
      return data as { id: string; status: string; solicitacao_id: string | null; escolhida_fornecedor_id: string | null };
    },
  });
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores-ativos"],
    queryFn: async () => {
      const { data, error } = await db("fornecedores").select("id,razao_social").eq("ativo", true).order("razao_social");
      if (error) throw error;
      return data as Forn[];
    },
  });
  const { data: cfs = [] } = useQuery({
    queryKey: ["cf", id],
    queryFn: async () => {
      const { data, error } = await db("cotacao_fornecedores").select("*").eq("cotacao_id", id);
      if (error) throw error;
      return data as CF[];
    },
  });

  const [fornId, setFornId] = useState("");
  const addForn = useMutation({
    mutationFn: async () => {
      if (!fornId) throw new Error("Selecione um fornecedor");
      const { error } = await db("cotacao_fornecedores").insert({ cotacao_id: id, fornecedor_id: fornId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fornecedor adicionado."); setFornId(""); qc.invalidateQueries({ queryKey: ["cf", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upCF = useMutation({
    mutationFn: async ({ cfId, patch }: { cfId: string; patch: Partial<CF> }) => {
      const { error } = await db("cotacao_fornecedores").update(patch).eq("id", cfId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cf", id] }),
  });

  const escolher = useMutation({
    mutationFn: async (cf: CF) => {
      await db("cotacao_fornecedores").update({ escolhida: false }).eq("cotacao_id", id);
      await db("cotacao_fornecedores").update({ escolhida: true }).eq("id", cf.id);
      await db("cotacoes").update({ status: "escolhida", escolhida_fornecedor_id: cf.fornecedor_id }).eq("id", id);
    },
    onSuccess: () => { toast.success("Vencedor selecionado."); qc.invalidateQueries({ queryKey: ["cot", id] }); qc.invalidateQueries({ queryKey: ["cf", id] }); },
  });

  const gerarPedido = useMutation({
    mutationFn: async () => {
      if (!cot?.escolhida_fornecedor_id) throw new Error("Escolha um fornecedor");
      const winner = cfs.find((c) => c.escolhida);
      const { data, error } = await db("pedidos_compra").insert({
        cotacao_id: id,
        fornecedor_id: cot.escolhida_fornecedor_id,
        condicao_pagamento: winner?.condicao_pagamento,
        frete: winner?.frete ?? 0,
        desconto: winner?.desconto ?? 0,
        valor_total: winner?.total ?? 0,
        status: "rascunho",
      }).select().single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (pid) => { toast.success("Pedido criado."); nav({ to: "/compras/pedidos/$id", params: { id: pid } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!cot) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">💬 Cotação · <Badge>{cot.status}</Badge></h1>
        {cot.status === "escolhida" && <Button size="sm" onClick={() => gerarPedido.mutate()}><ShoppingCart className="h-4 w-4 mr-1.5" />Gerar Pedido</Button>}
      </div>

      <Card className="p-4 flex gap-3 items-end">
        <div className="flex-1">
          <Label>Adicionar Fornecedor</Label>
          <Select value={fornId} onValueChange={setFornId}>
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>{fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={() => addForn.mutate()} disabled={addForn.isPending}><Plus className="h-4 w-4 mr-1.5" />Adicionar</Button>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-primary hover:bg-primary">
            {["Fornecedor","Cond. Pag.","Prazo (d)","Frete","Desconto","Total","Ação"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {cfs.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Adicione fornecedores para cotar.</TableCell></TableRow>
            : cfs.map((cf) => {
              const f = fornecedores.find((x) => x.id === cf.fornecedor_id);
              return (
                <TableRow key={cf.id} className={cf.escolhida ? "bg-primary/10" : ""}>
                  <TableCell className="font-medium">{f?.razao_social ?? cf.fornecedor_id.slice(0, 8)}</TableCell>
                  <TableCell><Input className="w-28" defaultValue={cf.condicao_pagamento ?? ""} onBlur={(e) => upCF.mutate({ cfId: cf.id, patch: { condicao_pagamento: e.target.value } })} /></TableCell>
                  <TableCell><Input className="w-20" type="number" defaultValue={cf.prazo_entrega_dias ?? 0} onBlur={(e) => upCF.mutate({ cfId: cf.id, patch: { prazo_entrega_dias: Number(e.target.value) } })} /></TableCell>
                  <TableCell><Input className="w-24" type="number" step="0.01" defaultValue={cf.frete} onBlur={(e) => upCF.mutate({ cfId: cf.id, patch: { frete: Number(e.target.value) } })} /></TableCell>
                  <TableCell><Input className="w-24" type="number" step="0.01" defaultValue={cf.desconto} onBlur={(e) => upCF.mutate({ cfId: cf.id, patch: { desconto: Number(e.target.value) } })} /></TableCell>
                  <TableCell><Input className="w-28" type="number" step="0.01" defaultValue={cf.total} onBlur={(e) => upCF.mutate({ cfId: cf.id, patch: { total: Number(e.target.value) } })} /></TableCell>
                  <TableCell>
                    {cf.escolhida ? <Badge>Escolhida</Badge> : <Button size="sm" variant="outline" onClick={() => escolher.mutate(cf)}><Trophy className="h-4 w-4 mr-1.5" />Escolher</Button>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
