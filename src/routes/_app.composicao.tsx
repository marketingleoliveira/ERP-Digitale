import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Printer, Layers } from "lucide-react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/digitale-logo.png.asset.json";
import { StatusDot } from "@/components/status-dot";

export const Route = createFileRoute("/_app/composicao")({
  ssr: false,
  component: ComposicaoPage,
});

type Composicao = {
  id: string;
  tipo: "Artigo" | "Fio";
  codigo: string;
  ncm: string | null;
  composicao: string;
  habilitado: boolean;
};

const PAGE_SIZE = 20;

function ComposicaoPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");

  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Composicao | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["composicoes"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("composicoes" as any) as any)
        .select("id, tipo, codigo, ncm, composicao, habilitado")
        .order("tipo", { ascending: true })
        .order("codigo", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Composicao[];
    },
  });

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const f = filter.toLowerCase();
    return items.filter((i) => i.composicao.toLowerCase().includes(f));
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = filtered.find((i) => i.id === selectedId) ?? null;

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<Composicao>) => {
      if (editing?.id) {
        const { error } = await (supabase.from("composicoes" as any) as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("composicoes" as any) as any).insert({ ...payload, owner_id: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["composicoes"] });
      setDialogOpen(false); setEditing(null);
      toast.success("Composição salva");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("composicoes" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["composicoes"] });
      setSelectedId(null); setDeleteOpen(false);
      toast.success("Composição excluída");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const toggleHabMut = useMutation({
    mutationFn: async ({ id, habilitado }: { id: string; habilitado: boolean }) => {
      const { error } = await (supabase.from("composicoes" as any) as any).update({ habilitado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["composicoes"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = () => {
    if (!selected) return toast.info("Selecione uma composição");
    setEditing(selected); setDialogOpen(true);
  };
  const askDelete = () => {
    if (!selected) return toast.info("Selecione uma composição");
    if (!isDev) return toast.error("Apenas o Desenvolvedor pode excluir");
    setDeleteOpen(true);
  };

  const handlePrint = async () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    try {
      const res = await fetch(logoAsset.url);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      doc.addImage(dataUrl, "PNG", 40, 25, 90, 35);
    } catch { /* logo optional */ }

    doc.setFontSize(14);
    doc.text("Listagem de Composições", 150, 45);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 150, 60);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 80,
      head: [["Tipo", "Código", "NCM", "Composição", "Hab"]],
      body: filtered.map((i) => [i.tipo, i.codigo, i.ncm ?? "-", i.composicao, i.habilitado ? "Sim" : "Não"]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Página ${doc.getCurrentPageInfo().pageNumber} / ${pageCount}  •  Total: ${filtered.length}`,
          40,
          doc.internal.pageSize.getHeight() - 20,
        );
      },
    });
    doc.save(`composicoes-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Listagem Composição</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b bg-muted/40 p-2">
          <Button size="sm" variant="outline" onClick={openNew}><Plus className="h-4 w-4" /> Cadastrar</Button>
          <Button size="sm" variant="outline" onClick={openEdit} disabled={!selected}><Pencil className="h-4 w-4" /> Alterar</Button>
          <Button size="sm" variant="outline" onClick={askDelete} disabled={!selected}><Trash2 className="h-4 w-4" /> Excluir</Button>
          <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4" /> Imprimir</Button>
        </div>

        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="w-8 p-2"></th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">NCM</th>
                <th className="p-2 text-left">Composição</th>
                <th className="p-2 text-center w-16">Hab</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma composição encontrada</td></tr>
              ) : pageItems.map((i) => {
                const isSel = i.id === selectedId;
                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    onDoubleClick={() => { setEditing(i); setDialogOpen(true); }}
                    className={`cursor-pointer border-b hover:bg-muted/50 ${isSel ? "bg-primary/10" : ""} ${!i.habilitado ? "bg-destructive/10" : ""}`}
                  >
                    <td className="p-2"><Checkbox checked={isSel} onCheckedChange={() => setSelectedId(i.id)} /></td>
                    <td className="p-2">{i.tipo}</td>
                    <td className="p-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedId(i.id); }}
                            className="font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {i.codigo}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-72 p-0">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b"><td className="w-28 bg-muted/50 p-2 font-medium">Código:</td><td className="p-2">{i.codigo}</td></tr>
                              <tr className="border-b"><td className="bg-muted/50 p-2 font-medium">NCM:</td><td className="p-2 font-mono">{i.ncm || "—"}</td></tr>
                              <tr><td className="bg-muted/50 p-2 font-medium">Composição:</td><td className="p-2">{i.composicao}</td></tr>
                            </tbody>
                          </table>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="p-2 font-mono text-xs">{i.ncm || "—"}</td>
                    <td className="p-2">{i.composicao}</td>
                    <td className="p-2 text-center">
                      <StatusDot checked={!!i.habilitado} onToggle={(v: boolean) => toggleHabMut.mutate({ id: i.id, habilitado: v })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 p-2 text-sm">
          <div>Página: {page} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Próximo</Button>
            <span>Ir para:</span>
            <Select value={String(page)} onValueChange={(v) => setPage(Number(v))}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>Total de Registros: {filtered.length}</div>
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t bg-muted/20 p-3">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Composição</Label>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={() => setPage(1)}>Filtrar</Button>
        </div>
      </Card>

      <ComposicaoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSave={(p) => saveMut.mutate(p)}
        saving={saveMut.isPending}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir composição?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.codigo} — {selected?.composicao}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selected && deleteMut.mutate(selected.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ComposicaoDialog({
  open, onOpenChange, item, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Composicao | null;
  onSave: (p: Partial<Composicao>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Composicao>>({});

  useEffect(() => {
    if (!open) return;
    setForm(item ?? { tipo: "Artigo", habilitado: true });
  }, [open, item]);

  const set = <K extends keyof Composicao>(k: K, v: Composicao[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.tipo || !form.codigo || !form.composicao) {
      toast.error("Preencha Tipo, Código e Composição");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Layers className="h-4 w-4" />
            {item ? "Alterar Composição" : "Cadastrar Composição"}
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-md bg-muted/40 p-6">
          <div className="mx-auto grid max-w-md gap-3">
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm"><span className="text-destructive">*</span> Tipo:</Label>
              <Select value={form.tipo ?? "Artigo"} onValueChange={(v) => set("tipo", v as Composicao["tipo"])}>
                <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Artigo">Artigo</SelectItem>
                  <SelectItem value="Fio">Fio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm"><span className="text-destructive">*</span> Código:</Label>
              <Input className="h-8 w-40" value={form.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm">NCM:</Label>
              <Input className="h-8 w-40" value={form.ncm ?? ""} onChange={(e) => set("ncm", e.target.value)} />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm"><span className="text-destructive">*</span> Composição:</Label>
              <Input className="h-8" value={form.composicao ?? ""} onChange={(e) => set("composicao", e.target.value)} placeholder="Ex: 75%PES 25%PUE" />
            </div>
            <label className="ml-[122px] flex items-center gap-2 text-sm">
              <Checkbox checked={Boolean(form.habilitado)} onCheckedChange={(v) => set("habilitado", Boolean(v))} />
              Habilitado
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando…" : (item ? "Salvar" : "Cadastrar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
