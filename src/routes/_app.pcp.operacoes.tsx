import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/operacoes")({
  ssr: false,
  component: OperacoesPage,
});

type Op = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  centro_trabalho: string | null;
  setup_padrao_min: number;
  tempo_padrao_min: number;
  descricao: string | null;
  ativo: boolean;
};

const TIPOS = [
  "malharia", "tinturaria", "rama", "acabamento", "corte",
  "costura", "inspecao", "expedicao", "producao", "outros",
];

const empty = (): Omit<Op, "id"> => ({
  codigo: "", nome: "", tipo: "producao", centro_trabalho: "",
  setup_padrao_min: 0, tempo_padrao_min: 0, descricao: "", ativo: true,
});

function OperacoesPage() {
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Op | Omit<Op, "id">>(empty());

  const { data = [], isLoading } = useQuery({
    queryKey: ["operacoes_produtivas"],
    queryFn: async (): Promise<Op[]> => {
      const { data, error } = await supabase
        .from("operacoes_produtivas" as never).select("*").order("codigo");
      if (error) throw error;
      return (data ?? []) as unknown as Op[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const isEdit = "id" in form && form.id;
      const payload = { ...form, centro_trabalho: form.centro_trabalho || null, descricao: form.descricao || null };
      const q = isEdit
        ? supabase.from("operacoes_produtivas" as never).update(payload as never).eq("id", (form as Op).id)
        : supabase.from("operacoes_produtivas" as never).insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Operação salva.");
      setDlg(false);
      qc.invalidateQueries({ queryKey: ["operacoes_produtivas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operacoes_produtivas" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Operação removida.");
      qc.invalidateQueries({ queryKey: ["operacoes_produtivas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Operações Produtivas"
        description="Catálogo mestre de operações usadas nos roteiros"
        actions={
          <Button onClick={() => { setForm(empty()); setDlg(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nova operação
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Centro de trabalho</TableHead>
              <TableHead className="text-right">Setup (min)</TableHead>
              <TableHead className="text-right">Tempo (min)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            )}
            {!isLoading && data.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma operação cadastrada.</TableCell></TableRow>
            )}
            {data.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.codigo}</TableCell>
                <TableCell className="font-medium">{o.nome}</TableCell>
                <TableCell><Badge variant="outline">{o.tipo}</Badge></TableCell>
                <TableCell>{o.centro_trabalho ?? "—"}</TableCell>
                <TableCell className="text-right">{o.setup_padrao_min}</TableCell>
                <TableCell className="text-right">{o.tempo_padrao_min}</TableCell>
                <TableCell><Badge variant={o.ativo ? "default" : "secondary"}>{o.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => { setForm(o); setDlg(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir operação?")) delMut.mutate(o.id); }}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{"id" in form && form.id ? "Editar operação" : "Nova operação"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código</Label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex.: OP-MAL" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Malharia" />
            </div>
            <div>
              <Label>Centro de trabalho</Label>
              <Input value={form.centro_trabalho ?? ""} onChange={(e) => setForm({ ...form, centro_trabalho: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Setup padrão (min)</Label>
                <Input type="number" step="0.01" value={form.setup_padrao_min} onChange={(e) => setForm({ ...form, setup_padrao_min: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Tempo padrão (min)</Label>
                <Input type="number" step="0.01" value={form.tempo_padrao_min} onChange={(e) => setForm({ ...form, tempo_padrao_min: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: Boolean(v) })} id="op-ativo" />
              <Label htmlFor="op-ativo">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.codigo || !form.nome}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
