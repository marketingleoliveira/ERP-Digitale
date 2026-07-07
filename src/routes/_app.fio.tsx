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
import { Plus, Pencil, Trash2, Printer, Scissors } from "lucide-react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/digitale-logo.png.asset.json";
import { StatusDot } from "@/components/status-dot";

export const Route = createFileRoute("/_app/fio")({
  ssr: false,
  component: FioPage,
});

type Fio = {
  id: string;
  codigo: string;
  ncm: string | null;
  tipo: string | null;
  titulo: number | null;
  n_filamentos: number | null;
  n_cabos: number | null;
  composicao: string | null;
  composicao_id: string | null;
  cest: string | null;
  origem: string | null;
  quebra_percent: number | null;
  custo: number | null;
  cor: string | null;
  habilitado: boolean;
};

const PAGE_SIZE = 20;

function FioPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");

  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fio | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["fios"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("fios" as any) as any)
        .select("id, codigo, ncm, tipo, titulo, n_filamentos, n_cabos, composicao, composicao_id, cest, origem, quebra_percent, custo, cor, habilitado")
        .order("titulo", { ascending: true, nullsFirst: true })
        .order("codigo", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Fio[];
    },
  });

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const f = filter.toLowerCase();
    return items.filter((i) => String(i.titulo ?? "").toLowerCase().includes(f));
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = filtered.find((i) => i.id === selectedId) ?? null;

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<Fio>) => {
      if (editing?.id) {
        const { error } = await (supabase.from("fios" as any) as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("fios" as any) as any).insert({ ...payload, owner_id: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fios"] });
      setDialogOpen(false); setEditing(null);
      toast.success("Fio salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("fios" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fios"] });
      setSelectedId(null); setDeleteOpen(false);
      toast.success("Fio excluído");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const toggleHabMut = useMutation({
    mutationFn: async ({ id, habilitado }: { id: string; habilitado: boolean }) => {
      const { error } = await (supabase.from("fios" as any) as any).update({ habilitado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fios"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = () => {
    if (!selected) return toast.info("Selecione um fio");
    setEditing(selected); setDialogOpen(true);
  };
  const askDelete = () => {
    if (!selected) return toast.info("Selecione um fio");
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
    doc.text("Listagem de Fios", 150, 45);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 150, 60);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 80,
      head: [["Código", "NCM", "Tipo", "Título", "Nº Filamentos", "Nº Cabos", "Composição", "Hab"]],
      body: filtered.map((i) => [
        i.codigo, i.ncm ?? "-", i.tipo ?? "-", i.titulo ?? "-",
        i.n_filamentos ?? "-", i.n_cabos ?? "-", i.composicao ?? "-",
        i.habilitado ? "Sim" : "Não",
      ]),
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
    doc.save(`fios-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Scissors className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Listagem Fio</h1>
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
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">NCM</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-center">Título</th>
                <th className="p-2 text-center">Nº Filamentos</th>
                <th className="p-2 text-center">Nº Cabos</th>
                <th className="p-2 text-left">Composição</th>
                <th className="p-2 text-center w-16">Hab</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Nenhum fio encontrado</td></tr>
              ) : pageItems.map((i) => {
                const isSel = i.id === selectedId;
                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    onDoubleClick={() => { setEditing(i); setDialogOpen(true); }}
                    className={`cursor-pointer border-b hover:bg-muted/50 ${isSel ? "bg-primary/10" : ""}`}
                  >
                    <td className="p-2"><Checkbox checked={isSel} onCheckedChange={() => setSelectedId(i.id)} /></td>
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
                        <PopoverContent align="start" className="w-80 p-0">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b"><td className="w-32 bg-muted/50 p-2 font-medium">Código:</td><td className="p-2">{i.codigo}</td></tr>
                              <tr className="border-b"><td className="bg-muted/50 p-2 font-medium">NCM:</td><td className="p-2 font-mono">{i.ncm || "—"}</td></tr>
                              <tr className="border-b"><td className="bg-muted/50 p-2 font-medium">Tipo:</td><td className="p-2">{i.tipo || "—"}</td></tr>
                              <tr className="border-b"><td className="bg-muted/50 p-2 font-medium">Título:</td><td className="p-2">{i.titulo ?? "—"}</td></tr>
                              <tr className="border-b"><td className="bg-muted/50 p-2 font-medium">Nº Filamentos:</td><td className="p-2">{i.n_filamentos ?? "—"}</td></tr>
                              <tr className="border-b"><td className="bg-muted/50 p-2 font-medium">Nº Cabos:</td><td className="p-2">{i.n_cabos ?? "—"}</td></tr>
                              <tr><td className="bg-muted/50 p-2 font-medium">Composição:</td><td className="p-2">{i.composicao || "—"}</td></tr>
                            </tbody>
                          </table>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="p-2 font-mono text-xs">{i.ncm || "—"}</td>
                    <td className="p-2">{i.tipo || "—"}</td>
                    <td className="p-2 text-center">{i.titulo ?? "—"}</td>
                    <td className="p-2 text-center">{i.n_filamentos ?? "—"}</td>
                    <td className="p-2 text-center">{i.n_cabos ?? "—"}</td>
                    <td className="p-2">{i.composicao || "—"}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block h-3 w-3 rounded-full ${i.habilitado ? "bg-emerald-500" : "bg-rose-400"}`} />
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
            <Label className="text-xs">Título</Label>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={() => setPage(1)}>Filtrar</Button>
        </div>
      </Card>

      <FioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSave={(p) => saveMut.mutate(p)}
        saving={saveMut.isPending}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fio?</AlertDialogTitle>
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

function FioDialog({
  open, onOpenChange, item, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Fio | null;
  onSave: (p: Partial<Fio>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Fio>>({});

  const { data: composicoes = [] } = useQuery({
    queryKey: ["composicoes-lookup"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("composicoes" as any) as any)
        .select("id, composicao, tipo")
        .eq("habilitado", true)
        .order("composicao");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; composicao: string; tipo: string }>;
    },
  });

  useEffect(() => {
    if (!open) return;
    setForm(item ?? { habilitado: true, n_cabos: 1 });
  }, [open, item]);

  const set = <K extends keyof Fio>(k: K, v: Fio[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const required: Array<[keyof Fio, string]> = [
      ["composicao_id", "Composição"], ["tipo", "Tipo"], ["codigo", "Código"],
      ["ncm", "NCM"], ["origem", "Origem"], ["n_cabos", "Nº Cabos"],
      ["titulo", "Título"], ["n_filamentos", "Nº Filamentos"], ["quebra_percent", "Quebra %"],
    ];
    for (const [k, label] of required) {
      const v = form[k];
      if (v === undefined || v === null || v === "") { toast.error(`Preencha ${label}`); return; }
    }
    const comp = composicoes.find((c) => c.id === form.composicao_id);
    onSave({ ...form, composicao: comp?.composicao ?? form.composicao ?? null });
  };

  const num = (v: string) => (v === "" ? null : Number(v));

  const ORIGEM = [
    "0 - Nacional",
    "1 - Estrangeira (Importação direta)",
    "2 - Estrangeira (Adquirida no mercado interno)",
    "3 - Nacional (conteúdo importação > 40%)",
    "4 - Nacional (processos básicos)",
    "5 - Nacional (conteúdo importação <= 40%)",
    "6 - Estrangeira (Importação direta, sem similar nacional)",
    "7 - Estrangeira (Adquirida no mercado interno, sem similar nacional)",
    "8 - Nacional (conteúdo importação > 70%)",
  ];
  const TIPOS = ["liso", "tx.", "elast.", "trilobal"];

  const req = <span className="text-destructive">*</span>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Scissors className="h-4 w-4" />
            {item ? "Alterar Fio" : "Cadastrar Fio"}
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-md bg-muted/40 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Composição */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Composição:</Label>
              <Select value={form.composicao_id ?? ""} onValueChange={(v) => set("composicao_id", v)}>
                <SelectTrigger className="h-8"><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>
                  {composicoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.composicao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Tipo */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Tipo:</Label>
              <Select value={form.tipo ?? ""} onValueChange={(v) => set("tipo", v)}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {/* Código */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Código:</Label>
              <Input className="h-8 w-40" value={form.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} />
            </div>
            {/* CEST */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">CEST:</Label>
              <Input className="h-8 w-40" value={form.cest ?? ""} onChange={(e) => set("cest", e.target.value)} />
            </div>
            {/* NCM */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} NCM:</Label>
              <Input className="h-8 w-40" value={form.ncm ?? ""} onChange={(e) => set("ncm", e.target.value)} />
            </div>
            {/* Nº Cabos */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Nº Cabos:</Label>
              <Input className="h-8 w-24 text-right" type="number" value={form.n_cabos ?? ""} onChange={(e) => set("n_cabos", num(e.target.value))} />
            </div>
            {/* Origem */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Origem:</Label>
              <Select value={form.origem ?? ""} onValueChange={(v) => set("origem", v)}>
                <SelectTrigger className="h-8"><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>
                  {ORIGEM.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {/* Nº Filamentos */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Nº Filamentos:</Label>
              <Input className="h-8 w-24 text-right" type="number" value={form.n_filamentos ?? ""} onChange={(e) => set("n_filamentos", num(e.target.value))} />
            </div>
            {/* Título */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Título:</Label>
              <Input className="h-8 w-24 text-right" type="number" step="0.01" value={form.titulo ?? ""} onChange={(e) => set("titulo", num(e.target.value))} />
            </div>
            {/* Cor */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">Cor:</Label>
              <Input className="h-8 w-40" value={form.cor ?? ""} onChange={(e) => set("cor", e.target.value)} placeholder="[SELECIONE]" />
            </div>
            {/* Quebra % */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">{req} Quebra %:</Label>
              <Input className="h-8 w-24 text-right" type="number" step="0.01" value={form.quebra_percent ?? ""} onChange={(e) => set("quebra_percent", num(e.target.value))} />
            </div>
            <div />
            {/* R$ Custo */}
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <Label className="text-right text-sm">R$ Custo:</Label>
              <Input className="h-8 w-32 text-right" type="number" step="0.01" value={form.custo ?? 0} onChange={(e) => set("custo", num(e.target.value))} />
            </div>
            <div />
          </div>
          <label className="mt-3 flex items-center gap-2 pl-[138px] text-sm">
            <Checkbox checked={Boolean(form.habilitado)} onCheckedChange={(v) => set("habilitado", Boolean(v))} />
            Habilitado
          </label>
        </div>
        <p className="text-center text-xs text-destructive">* Campo Obrigatório</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando…" : (item ? "Salvar" : "Cadastrar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
