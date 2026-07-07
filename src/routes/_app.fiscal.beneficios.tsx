import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/fiscal/beneficios")({ ssr: false, component: BeneficiosPage });

type Row = {
  id: string; uf: string | null; ncm_prefix: string | null;
  tipo: "reducao" | "isencao" | "diferimento" | "suspensao";
  percentual: number; base_legal: string | null;
  vigencia_inicio: string | null; vigencia_fim: string | null; ativo: boolean;
};

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","EX","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

async function fetchAll(): Promise<Row[]> {
  const { data, error } = await supabase.from("beneficios_fiscais" as never).select("*").order("uf");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function BeneficiosPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["beneficios_fiscais"], queryFn: fetchAll });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("beneficios_fiscais" as never) as never as {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
      }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluído."); qc.invalidateQueries({ queryKey: ["beneficios_fiscais"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">🎁 Benefícios Fiscais</h1>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><FilePlus2 className="h-4 w-4 mr-1.5" />Novo benefício</Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["UF","NCM","Tipo","%","Base Legal","Vigência","Ativo","Ações"].map((h) => (
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum benefício cadastrado.</TableCell></TableRow>
            ) : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.uf ?? "todas"}</TableCell>
                <TableCell className="font-mono">{r.ncm_prefix ?? "*"}</TableCell>
                <TableCell className="capitalize">{r.tipo}</TableCell>
                <TableCell>{Number(r.percentual).toFixed(2)}</TableCell>
                <TableCell className="text-xs">{r.base_legal ?? "—"}</TableCell>
                <TableCell className="text-xs">{[r.vigencia_inicio, r.vigencia_fim].filter(Boolean).join(" até ") || "—"}</TableCell>
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
      <BeneficioDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function BeneficioDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null }) {
  const qc = useQueryClient();
  const empty: Omit<Row, "id"> = { uf: null, ncm_prefix: null, tipo: "reducao", percentual: 0, base_legal: "", vigencia_inicio: null, vigencia_fim: null, ativo: true };
  const [form, setForm] = useState<Omit<Row, "id">>(empty);
  useEffect(() => { setForm(editing ?? empty); /* eslint-disable-next-line */ }, [editing, open]);
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, uf: form.uf || null, ncm_prefix: form.ncm_prefix || null, base_legal: form.base_legal || null };
      if (editing) {
        const { error } = await (supabase.from("beneficios_fiscais" as never) as never as {
          update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
        }).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("beneficios_fiscais" as never) as never as {
          insert: (v: object) => Promise<{ error: Error | null }>;
        }).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); qc.invalidateQueries({ queryKey: ["beneficios_fiscais"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar benefício" : "Novo benefício"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>UF</Label>
            <Select value={form.uf ?? "__all__"} onValueChange={(v) => set("uf", v === "__all__" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="__all__">Todas</SelectItem>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>NCM (prefixo)</Label><Input value={form.ncm_prefix ?? ""} onChange={(e) => set("ncm_prefix", e.target.value || null)} /></div>
          <div><Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v as Row["tipo"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reducao">Redução</SelectItem>
                <SelectItem value="isencao">Isenção</SelectItem>
                <SelectItem value="diferimento">Diferimento</SelectItem>
                <SelectItem value="suspensao">Suspensão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Percentual %</Label><Input type="number" step="0.01" value={form.percentual} onChange={(e) => set("percentual", Number(e.target.value))} /></div>
          <div className="col-span-2"><Label>Base Legal</Label><Input value={form.base_legal ?? ""} onChange={(e) => set("base_legal", e.target.value)} /></div>
          <div><Label>Vigência Início</Label><Input type="date" value={form.vigencia_inicio ?? ""} onChange={(e) => set("vigencia_inicio", e.target.value || null)} /></div>
          <div><Label>Vigência Fim</Label><Input type="date" value={form.vigencia_fim ?? ""} onChange={(e) => set("vigencia_fim", e.target.value || null)} /></div>
          <div className="flex items-center gap-2 col-span-2"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
