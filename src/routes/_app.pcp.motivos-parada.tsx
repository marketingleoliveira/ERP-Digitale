import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/motivos-parada")({ ssr: false, component: MotivosParadaPage });

type Motivo = { id: string; codigo: string; descricao: string; categoria: string; planejada: boolean; ativo: boolean };
const CATEGORIAS = ["setup", "manutencao", "qualidade", "falta_material", "falta_operador", "energia", "outros"];
const empty = (): Omit<Motivo, "id"> => ({ codigo: "", descricao: "", categoria: "outros", planejada: false, ativo: true });

function MotivosParadaPage() {
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Motivo | Omit<Motivo, "id">>(empty());

  const { data = [], isLoading } = useQuery({
    queryKey: ["motivos_parada"],
    queryFn: async (): Promise<Motivo[]> => {
      const { data, error } = await supabase.from("motivos_parada" as never).select("*").order("codigo");
      if (error) throw error;
      return (data ?? []) as unknown as Motivo[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const isEdit = "id" in form && form.id;
      const q = isEdit
        ? supabase.from("motivos_parada" as never).update(form as never).eq("id", (form as Motivo).id)
        : supabase.from("motivos_parada" as never).insert(form as never);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { toast.success("Motivo salvo."); setDlg(false); qc.invalidateQueries({ queryKey: ["motivos_parada"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("motivos_parada" as never).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removido."); qc.invalidateQueries({ queryKey: ["motivos_parada"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Motivos de Parada"
        description="Catálogo padronizado para apontamentos de chão de fábrica e cálculo de OEE."
        actions={<Button onClick={() => { setForm(empty()); setDlg(true); }}><Plus className="mr-2 h-4 w-4" /> Novo motivo</Button>}
      />
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum motivo cadastrado.</TableCell></TableRow>}
            {data.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-sm">{m.codigo}</TableCell>
                <TableCell>{m.descricao}</TableCell>
                <TableCell><Badge variant="outline">{m.categoria}</Badge></TableCell>
                <TableCell>{m.planejada ? <Badge>Planejada</Badge> : <Badge variant="secondary">Não planejada</Badge>}</TableCell>
                <TableCell><Badge variant={m.ativo ? "default" : "secondary"}>{m.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => { setForm(m); setDlg(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir motivo?")) delMut.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{"id" in form && form.id ? "Editar motivo" : "Novo motivo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="Ex.: SETUP01" /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Checkbox id="pl" checked={form.planejada} onCheckedChange={(v) => setForm({ ...form, planejada: Boolean(v) })} /><Label htmlFor="pl">Parada planejada</Label></div>
              <div className="flex items-center gap-2"><Checkbox id="at" checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: Boolean(v) })} /><Label htmlFor="at">Ativo</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.codigo || !form.descricao}>{saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}