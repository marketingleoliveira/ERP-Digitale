import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/financeiro/contas-bancarias")({
  ssr: false,
  head: () => ({ meta: [{ title: "Contas Bancárias" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type Row = { id: string; nome: string; banco: string | null; agencia: string | null; conta: string | null; tipo: string; saldo_inicial: number; ativa: boolean };
const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["contas_bancarias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_bancarias").select("*").order("nome");
      if (error) throw error;
      return data as Row[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas Bancárias</h1>
        <NovoDialog onDone={() => qc.invalidateQueries({ queryKey: ["contas_bancarias"] })} />
      </div>
      <Card>
        <CardHeader><CardTitle>Contas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Banco</TableHead><TableHead>Ag/Conta</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Saldo inicial</TableHead><TableHead>Ativa</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6}>Carregando…</TableCell></TableRow> :
                data.map(r => <TableRow key={r.id}>
                  <TableCell>{r.nome}</TableCell><TableCell>{r.banco ?? "—"}</TableCell>
                  <TableCell>{r.agencia ?? "—"} / {r.conta ?? "—"}</TableCell>
                  <TableCell>{r.tipo}</TableCell>
                  <TableCell className="text-right">{fmt(Number(r.saldo_inicial))}</TableCell>
                  <TableCell>{r.ativa ? "Sim" : "Não"}</TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [ag, setAg] = useState("");
  const [conta, setConta] = useState("");
  const [tipo, setTipo] = useState("corrente");
  const [saldo, setSaldo] = useState("0");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contas_bancarias").insert({ nome, banco, agencia: ag, conta, tipo, saldo_inicial: Number(saldo) });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Conta criada."); setOpen(false); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div><Label>Banco</Label><Input value={banco} onChange={e => setBanco(e.target.value)} /></div>
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["corrente","poupanca","caixa","cartao","outros"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Agência</Label><Input value={ag} onChange={e => setAg(e.target.value)} /></div>
          <div><Label>Conta</Label><Input value={conta} onChange={e => setConta(e.target.value)} /></div>
          <div className="col-span-2"><Label>Saldo inicial</Label><Input type="number" step="0.01" value={saldo} onChange={e => setSaldo(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={!nome || save.isPending}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
