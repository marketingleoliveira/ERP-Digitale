import { createFileRoute } from "@tanstack/react-router";
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
import { Switch } from "@/components/ui/switch";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/fiscal/impostos")({ ssr: false, component: ImpostosPage });

type Row = { id: string; nome: string; tipo: string; aliquota: number; ativo: boolean; observacao: string | null };
const TIPOS = ["ICMS", "IPI", "PIS", "COFINS", "ISS", "OUTRO"] as const;

async function fetchAll(): Promise<Row[]> {
  const { data, error } = await supabase.from("impostos" as never).select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function ImpostosPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["impostos"], queryFn: fetchAll });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("impostos" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluído."); qc.invalidateQueries({ queryKey: ["impostos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">💰 Impostos</h1>
      <Card className="p-3">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><FilePlus2 className="h-4 w-4 mr-1.5" />Novo imposto</Button>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Nome</TableHead>
              <TableHead className="text-primary-foreground">Tipo</TableHead>
              <TableHead className="text-primary-foreground">Alíquota (%)</TableHead>
              <TableHead className="text-primary-foreground">Ativo</TableHead>
              <TableHead className="text-primary-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow> :
              data.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum imposto cadastrado.</TableCell></TableRow> :
              data.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.nome}</TableCell>
                  <TableCell>{r.tipo}</TableCell>
                  <TableCell>{Number(r.aliquota).toFixed(2)}</TableCell>
                  <TableCell>{r.ativo ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
      <ImpostoDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function ImpostoDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(""); const [tipo, setTipo] = useState<string>("ICMS");
  const [aliq, setAliq] = useState("0"); const [ativo, setAtivo] = useState(true);
  const [obs, setObs] = useState("");

  useEffect(() => {
    setNome(editing?.nome ?? ""); setTipo(editing?.tipo ?? "ICMS");
    setAliq(String(editing?.aliquota ?? "0")); setAtivo(editing?.ativo ?? true);
    setObs(editing?.observacao ?? "");
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome, tipo, aliquota: Number(aliq) || 0, ativo, observacao: obs || null };
      if (editing) {
        const { error } = await (supabase.from("impostos" as never) as never as { update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("impostos" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); qc.invalidateQueries({ queryKey: ["impostos"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar imposto" : "Novo imposto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Alíquota (%)</Label><Input type="number" step="0.01" value={aliq} onChange={e => setAliq(e.target.value)} /></div>
          </div>
          <div><Label>Observação</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} /></div>
          <div className="flex items-center gap-2"><Switch checked={ativo} onCheckedChange={setAtivo} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !nome}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
