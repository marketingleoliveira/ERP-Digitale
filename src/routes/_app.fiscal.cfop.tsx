import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/fiscal/cfop")({ ssr: false, component: CfopPage });

type Cfop = { id: string; codigo: string; descricao: string; tipo: "entrada" | "saida"; ativo: boolean };

async function fetchAll(): Promise<Cfop[]> {
  const { data, error } = await supabase.from("cfop" as never).select("*").order("codigo");
  if (error) throw error;
  return (data ?? []) as unknown as Cfop[];
}

function CfopPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["cfop"], queryFn: fetchAll });
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cfop | null>(null);

  const filtered = useMemo(() => data.filter(c =>
    c.codigo.includes(filter) || c.descricao.toLowerCase().includes(filter.toLowerCase())
  ), [data, filter]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("cfop" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluído."); qc.invalidateQueries({ queryKey: ["cfop"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📄 CFOP</h1>
      <Card className="p-3 flex flex-wrap gap-2">
        <Input placeholder="Buscar código ou descrição…" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-sm" />
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><FilePlus2 className="h-4 w-4 mr-1.5" />Novo CFOP</Button>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Código</TableHead>
              <TableHead className="text-primary-foreground">Descrição</TableHead>
              <TableHead className="text-primary-foreground">Tipo</TableHead>
              <TableHead className="text-primary-foreground">Ativo</TableHead>
              <TableHead className="text-primary-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum CFOP cadastrado.</TableCell></TableRow> :
              filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.codigo}</TableCell>
                  <TableCell>{c.descricao}</TableCell>
                  <TableCell className="capitalize">{c.tipo}</TableCell>
                  <TableCell>{c.ativo ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </Card>
      <CfopDialog open={open} onOpenChange={setOpen} editing={editing} onSaved={() => qc.invalidateQueries({ queryKey: ["cfop"] })} />
    </div>
  );
}

function CfopDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Cfop | null; onSaved: () => void }) {
  const [codigo, setCodigo] = useState(editing?.codigo ?? "");
  const [descricao, setDescricao] = useState(editing?.descricao ?? "");
  const [tipo, setTipo] = useState<"entrada" | "saida">(editing?.tipo ?? "saida");
  const [ativo, setAtivo] = useState(editing?.ativo ?? true);

  useEffect(() => {
    setCodigo(editing?.codigo ?? ""); setDescricao(editing?.descricao ?? "");
    setTipo(editing?.tipo ?? "saida"); setAtivo(editing?.ativo ?? true);
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { codigo, descricao, tipo, ativo };
      if (editing) {
        const { error } = await (supabase.from("cfop" as never) as never as { update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("cfop" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar CFOP" : "Novo CFOP"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Código</Label><Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex.: 5102" /></div>
          <div><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "entrada" | "saida")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2"><Switch checked={ativo} onCheckedChange={setAtivo} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !codigo || !descricao}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
