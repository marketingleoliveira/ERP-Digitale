import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Pencil, Plus, Trash2, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/roteiros")({
  ssr: false,
  component: RoteirosPage,
});

type Roteiro = {
  id: string;
  codigo: string;
  descricao: string;
  article_id: string | null;
  revisao: number;
  ativo: boolean;
  tempo_padrao_min: number;
  setup_min: number;
  observacoes: string | null;
};

type ArticleLite = { id: string; codigo: string | null; descricao: string | null };

const empty = (): Omit<Roteiro, "id"> => ({
  codigo: "", descricao: "", article_id: null, revisao: 1, ativo: true,
  tempo_padrao_min: 0, setup_min: 0, observacoes: "",
});

function RoteirosPage() {
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Roteiro | Omit<Roteiro, "id">>(empty());

  const { data = [], isLoading } = useQuery({
    queryKey: ["roteiros"],
    queryFn: async (): Promise<Roteiro[]> => {
      const { data, error } = await supabase.from("roteiros" as never).select("*").order("codigo");
      if (error) throw error;
      return (data ?? []) as unknown as Roteiro[];
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["articles-lite"],
    queryFn: async (): Promise<ArticleLite[]> => {
      const { data, error } = await supabase.from("articles").select("id, codigo, descricao").order("codigo");
      if (error) throw error;
      return (data ?? []) as unknown as ArticleLite[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const isEdit = "id" in form && form.id;
      const payload = { ...form, observacoes: form.observacoes || null };
      const q = isEdit
        ? supabase.from("roteiros" as never).update(payload as never).eq("id", (form as Roteiro).id)
        : supabase.from("roteiros" as never).insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Roteiro salvo.");
      setDlg(false);
      qc.invalidateQueries({ queryKey: ["roteiros"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roteiros" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Roteiro removido.");
      qc.invalidateQueries({ queryKey: ["roteiros"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Roteiros de Produção"
        description="Sequência de operações produtivas por artigo (Fase 1 PCP)"
        actions={
          <Button onClick={() => { setForm(empty()); setDlg(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo roteiro
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Artigo</TableHead>
              <TableHead className="text-right">Rev.</TableHead>
              <TableHead className="text-right">Tempo</TableHead>
              <TableHead className="text-right">Setup</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            )}
            {!isLoading && data.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum roteiro cadastrado.</TableCell></TableRow>
            )}
            {data.map((r) => {
              const art = articles.find((a) => a.id === r.article_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                  <TableCell className="font-medium">{r.descricao}</TableCell>
                  <TableCell>{art ? `${art.codigo ?? ""} — ${art.descricao ?? ""}` : "—"}</TableCell>
                  <TableCell className="text-right">{r.revisao}</TableCell>
                  <TableCell className="text-right">{r.tempo_padrao_min} min</TableCell>
                  <TableCell className="text-right">{r.setup_min} min</TableCell>
                  <TableCell><Badge variant={r.ativo ? "default" : "secondary"}>{r.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Link to="/pcp/roteiros/$id" params={{ id: r.id }}>
                      <Button size="sm" variant="outline"><RouteIcon className="h-4 w-4 mr-1" />Etapas</Button>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => { setForm(r); setDlg(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir roteiro?")) delMut.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{"id" in form && form.id ? "Editar roteiro" : "Novo roteiro"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código</Label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex.: CARIBE" />
              </div>
              <div>
                <Label>Revisão</Label>
                <Input type="number" value={form.revisao} onChange={(e) => setForm({ ...form, revisao: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Artigo (opcional)</Label>
              <Select value={form.article_id ?? "__none"} onValueChange={(v) => setForm({ ...form, article_id: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhum —</SelectItem>
                  {articles.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.codigo} — {a.descricao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tempo padrão (min)</Label>
                <Input type="number" step="0.01" value={form.tempo_padrao_min} onChange={(e) => setForm({ ...form, tempo_padrao_min: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Setup (min)</Label>
                <Input type="number" step="0.01" value={form.setup_min} onChange={(e) => setForm({ ...form, setup_min: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: Boolean(v) })} id="rot-ativo" />
              <Label htmlFor="rot-ativo">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.codigo || !form.descricao}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
