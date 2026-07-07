import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type NF = {
  id: string; tipo: "saida" | "entrada" | "importacao"; numero: string; serie: string;
  data_emissao: string; valor_total: number; status: string;
  chave_acesso: string | null; observacao: string | null;
  cliente_id: string | null; fornecedor_id: string | null;
};

const STATUS = ["rascunho", "emitida", "autorizada", "cancelada"] as const;

export function NotaFiscalList({ tipo, title, emoji }: { tipo: NF["tipo"]; title: string; emoji: string }) {
  const qc = useQueryClient();
  const key = ["notas_fiscais", tipo];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("notas_fiscais" as never)
        .select("*").eq("tipo", tipo).order("data_emissao", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NF[];
    },
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NF | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("notas_fiscais" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluída."); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">{emoji} {title}</h1>
      <Card className="p-3">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <FilePlus2 className="h-4 w-4 mr-1.5" />Nova nota
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Número</TableHead>
              <TableHead className="text-primary-foreground">Série</TableHead>
              <TableHead className="text-primary-foreground">Emissão</TableHead>
              <TableHead className="text-primary-foreground">Valor Total</TableHead>
              <TableHead className="text-primary-foreground">Status</TableHead>
              <TableHead className="text-primary-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow> :
              data.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma nota cadastrada.</TableCell></TableRow> :
              data.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono">{n.numero}</TableCell>
                  <TableCell>{n.serie}</TableCell>
                  <TableCell>{new Date(n.data_emissao).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>R$ {Number(n.valor_total).toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{n.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(n); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(n.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
      <NFDialog open={open} onOpenChange={setOpen} editing={editing} tipo={tipo} onSaved={() => qc.invalidateQueries({ queryKey: key })} />
    </div>
  );
}

function NFDialog({ open, onOpenChange, editing, tipo, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: NF | null;
  tipo: NF["tipo"]; onSaved: () => void;
}) {
  const [numero, setNumero] = useState(""); const [serie, setSerie] = useState("1");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState("0"); const [status, setStatus] = useState<string>("rascunho");
  const [chave, setChave] = useState(""); const [obs, setObs] = useState("");

  useEffect(() => {
    setNumero(editing?.numero ?? ""); setSerie(editing?.serie ?? "1");
    setData(editing?.data_emissao ?? new Date().toISOString().slice(0, 10));
    setValor(String(editing?.valor_total ?? "0")); setStatus(editing?.status ?? "rascunho");
    setChave(editing?.chave_acesso ?? ""); setObs(editing?.observacao ?? "");
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        tipo, numero, serie, data_emissao: data,
        valor_total: Number(valor) || 0, status,
        chave_acesso: chave || null, observacao: obs || null,
      };
      if (editing) {
        const { error } = await (supabase.from("notas_fiscais" as never) as never as { update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("notas_fiscais" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salva."); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Editar nota" : "Nova nota"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Número</Label><Input value={numero} onChange={e => setNumero(e.target.value)} /></div>
          <div><Label>Série</Label><Input value={serie} onChange={e => setSerie(e.target.value)} /></div>
          <div><Label>Data de emissão</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
          <div><Label>Valor total (R$)</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} /></div>
          <div><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Chave de acesso</Label><Input value={chave} onChange={e => setChave(e.target.value)} maxLength={44} /></div>
          <div className="col-span-2"><Label>Observação</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !numero}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
