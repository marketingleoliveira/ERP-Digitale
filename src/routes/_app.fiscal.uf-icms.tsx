import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
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

export const Route = createFileRoute("/_app/fiscal/uf-icms")({ ssr: false, component: UfIcmsPage });

type Row = { id: string; uf_origem: string; uf_destino: string; aliquota: number; tipo: "interna" | "interestadual"; ativo: boolean };
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

async function fetchAll(): Promise<Row[]> {
  const { data, error } = await supabase.from("uf_icms" as never).select("*").order("uf_origem").order("uf_destino");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function UfIcmsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["uf_icms"], queryFn: fetchAll });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("uf_icms" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluído."); qc.invalidateQueries({ queryKey: ["uf_icms"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🧾 UF ICMS</h1>
      <Card className="p-3">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><FilePlus2 className="h-4 w-4 mr-1.5" />Nova alíquota</Button>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">UF Origem</TableHead>
              <TableHead className="text-primary-foreground">UF Destino</TableHead>
              <TableHead className="text-primary-foreground">Alíquota (%)</TableHead>
              <TableHead className="text-primary-foreground">Tipo</TableHead>
              <TableHead className="text-primary-foreground">Ativo</TableHead>
              <TableHead className="text-primary-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow> :
              data.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma alíquota cadastrada.</TableCell></TableRow> :
              data.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.uf_origem}</TableCell><TableCell>{r.uf_destino}</TableCell>
                  <TableCell>{Number(r.aliquota).toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{r.tipo}</TableCell>
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
      <UfDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function UfDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null }) {
  const qc = useQueryClient();
  const [uo, setUo] = useState("SP");
  const [ud, setUd] = useState("SP");
  const [aliq, setAliq] = useState("0");
  const [tipo, setTipo] = useState<"interna" | "interestadual">("interestadual");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    setUo(editing?.uf_origem ?? "SP"); setUd(editing?.uf_destino ?? "SP");
    setAliq(String(editing?.aliquota ?? "0"));
    setTipo(editing?.tipo ?? "interestadual"); setAtivo(editing?.ativo ?? true);
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { uf_origem: uo, uf_destino: ud, aliquota: Number(aliq) || 0, tipo, ativo };
      if (editing) {
        const { error } = await (supabase.from("uf_icms" as never) as never as { update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("uf_icms" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); qc.invalidateQueries({ queryKey: ["uf_icms"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar alíquota" : "Nova alíquota"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>UF Origem</Label>
            <Select value={uo} onValueChange={setUo}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>UF Destino</Label>
            <Select value={ud} onValueChange={setUd}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Alíquota (%)</Label><Input type="number" step="0.01" value={aliq} onChange={e => setAliq(e.target.value)} /></div>
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "interna" | "interestadual")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="interna">Interna</SelectItem><SelectItem value="interestadual">Interestadual</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 col-span-2"><Switch checked={ativo} onCheckedChange={setAtivo} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
