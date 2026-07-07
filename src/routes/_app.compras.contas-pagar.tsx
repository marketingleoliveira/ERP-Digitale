import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/compras/contas-pagar")({ ssr: false, component: Page });

type Row = { id: string; descricao: string; parcela: number; total_parcelas: number; valor: number; vencimento: string; status: string; fornecedores: { razao_social: string } | null };

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["contas_pagar"],
    queryFn: async () => {
      const { data, error } = await db("contas_pagar").select("*, fornecedores(razao_social)").order("vencimento");
      if (error) throw error;
      return data as Row[];
    },
  });

  const total = data.filter((r) => r.status === "aberta").reduce((s, r) => s + Number(r.valor), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">💰 Contas a Pagar</h1>
        <div className="text-sm">Total em aberto: <span className="font-semibold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Fornecedor","Descrição","Parcela","Vencimento","Valor","Status","Ações"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            : data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma conta.</TableCell></TableRow>
            : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.fornecedores?.razao_social ?? "—"}</TableCell>
                <TableCell>{r.descricao}</TableCell>
                <TableCell>{r.parcela}/{r.total_parcelas}</TableCell>
                <TableCell>{new Date(r.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>R$ {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell>
                  {r.status === "aberta" && <LiquidarDialog row={r} onDone={() => qc.invalidateQueries({ queryKey: ["contas_pagar"] })} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function LiquidarDialog({ row, onDone }: { row: Row; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(String(row.valor));
  const [juros, setJuros] = useState("0");
  const [desconto, setDesconto] = useState("0");
  const [forma, setForma] = useState("pix");
  const [conta, setConta] = useState<string | undefined>();
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  const { data: contas = [] } = useQuery({
    queryKey: ["contas_bancarias_ativas"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_bancarias").select("id,nome").eq("ativa", true);
      if (error) throw error;
      return data as { id: string; nome: string }[];
    },
  });

  const liquidar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("liquidar_conta_pagar", {
        _conta_id: row.id,
        _valor_pago: Number(valor),
        _data: data,
        _conta_bancaria_id: conta ?? undefined,
        _forma_pagamento: forma,
        _juros: Number(juros),
        _desconto: Number(desconto),
        _observacao: undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Liquidação registrada."); setOpen(false); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><DollarSign className="h-4 w-4 mr-1.5" />Liquidar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Liquidar {row.descricao}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
          <div><Label>Valor pago</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
          <div><Label>Juros</Label><Input type="number" step="0.01" value={juros} onChange={(e) => setJuros(e.target.value)} /></div>
          <div><Label>Desconto</Label><Input type="number" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} /></div>
          <div><Label>Forma</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pix","boleto","transferencia","dinheiro","cartao","cheque"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Conta bancária</Label>
            <Select value={conta} onValueChange={setConta}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => liquidar.mutate()} disabled={liquidar.isPending}>
            {liquidar.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
