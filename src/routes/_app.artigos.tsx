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
import { Plus, Pencil, Trash2, Printer, Shirt } from "lucide-react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/digitale-logo.png.asset.json";

export const Route = createFileRoute("/_app/artigos")({
  ssr: false,
  component: ArtigosPage,
});

type Article = {
  id: string;
  codigo: string | null;
  ncm: string | null;
  nome: string;
  composicao: string | null;
  rendimento: number | null;
  ativo: boolean;
};

const PAGE_SIZE = 20;

function ArtigosPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");

  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, codigo, ncm, nome, composicao, rendimento, ativo")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
  });

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const f = filter.toLowerCase();
    return items.filter((i) => i.nome.toLowerCase().includes(f));
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = filtered.find((i) => i.id === selectedId) ?? null;

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<Article>) => {
      if (editing?.id) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      setDialogOpen(false); setEditing(null);
      toast.success("Artigo salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      setSelectedId(null); setDeleteOpen(false);
      toast.success("Artigo excluído");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = () => {
    if (!selected) return toast.info("Selecione um artigo");
    setEditing(selected); setDialogOpen(true);
  };
  const askDelete = () => {
    if (!selected) return toast.info("Selecione um artigo");
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
    doc.text("Listagem de Artigos", 150, 45);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 150, 60);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 80,
      head: [["Código", "NCM", "Artigo", "Composição", "Rendimento", "Hab"]],
      body: filtered.map((i) => [
        i.codigo ?? "-",
        i.ncm ?? "-",
        i.nome,
        i.composicao ?? "-",
        i.rendimento != null ? Number(i.rendimento).toFixed(2) : "-",
        i.ativo ? "Sim" : "Não",
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
    doc.save(`artigos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shirt className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Listagem Artigo</h1>
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
                <th className="p-2 text-left">Artigo</th>
                <th className="p-2 text-left">Composição</th>
                <th className="p-2 text-right w-24">Rendimento</th>
                <th className="p-2 text-center w-16">Hab</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum artigo encontrado</td></tr>
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
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedId(i.id); setDetailId(i.id); }}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {i.codigo || "—"}
                      </button>
                    </td>
                    <td className="p-2 font-mono text-xs">{i.ncm || "—"}</td>
                    <td className="p-2 uppercase">{i.nome}</td>
                    <td className="p-2">{i.composicao || "—"}</td>
                    <td className="p-2 text-right">{i.rendimento != null ? Number(i.rendimento).toFixed(2) : "—"}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block h-3 w-3 rounded-full ${i.ativo ? "bg-emerald-500" : "bg-rose-400"}`} />
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
            <Label className="text-xs">Artigo</Label>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={() => setPage(1)}>Filtrar</Button>
        </div>
      </Card>

      <ArtigoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        articleId={editing?.id ?? null}
        ownerId={user?.id ?? null}
        onSaved={() => qc.invalidateQueries({ queryKey: ["articles"] })}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.codigo} — {selected?.nome}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selected && deleteMut.mutate(selected.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ArtigoDetailDialog id={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </div>
  );
}

function ArtigoDialog({
  open, onOpenChange, item, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Article | null;
  onSave: (p: Partial<Article>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Article>>({});

  useEffect(() => {
    if (!open) return;
    setForm(item ?? { ativo: true });
  }, [open, item]);

  const set = <K extends keyof Article>(k: K, v: Article[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.codigo || !form.nome) {
      toast.error("Preencha Código e Artigo");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Shirt className="h-4 w-4" />
            {item ? "Alterar Artigo" : "Cadastrar Artigo"}
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-md bg-muted/40 p-6">
          <div className="mx-auto grid max-w-md gap-3">
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm"><span className="text-destructive">*</span> Código:</Label>
              <Input className="h-8 w-40" value={form.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm">NCM:</Label>
              <Input className="h-8 w-40" value={form.ncm ?? ""} onChange={(e) => set("ncm", e.target.value)} />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm"><span className="text-destructive">*</span> Artigo:</Label>
              <Input className="h-8" value={form.nome ?? ""} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: TECIDO CORSEGA" />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm">Composição:</Label>
              <Input className="h-8" value={form.composicao ?? ""} onChange={(e) => set("composicao", e.target.value)} placeholder="Ex: 78%PES 22%PUE" />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-right text-sm">Rendimento:</Label>
              <Input
                type="number"
                step="0.01"
                className="h-8 w-32"
                value={form.rendimento ?? ""}
                onChange={(e) => set("rendimento", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <label className="ml-[122px] flex items-center gap-2 text-sm">
              <Checkbox checked={Boolean(form.ativo)} onCheckedChange={(v) => set("ativo", Boolean(v))} />
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

type ArticleDetail = Article & {
  tipo: string | null; cest: string | null; origem: string | null; fci: string | null;
  cliente: string | null; p_acabamento: string | null; largura: number | null;
  gramatura: number | null; lfa: number | null; falha_agulha: boolean | null;
  tipo_maquina: string | null; diametro: number | null; finura: number | null;
  n_alimentadores: number | null; disposicao_agulhas: string | null; rpm: number | null;
  n_voltas: number | null; r_malharia: number | null; r_malharia_compl: number | null;
  r_custo: number | null; r_venda: number | null; r_venda_metros: number | null;
  observacao: string | null; imagem_url: string | null;
};

type ArticleFio = {
  id: string; fio_descricao: string; qtd_cones: number; porcentagem: number;
};

function Row({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-[130px_1fr] border-b border-border/60 ${className}`}>
      <div className="bg-primary/10 px-3 py-1.5 text-sm font-medium">{label}</div>
      <div className="px-3 py-1.5 text-sm">{value ?? "—"}</div>
    </div>
  );
}

function ArtigoDetailDialog({ id, onOpenChange }: { id: string | null; onOpenChange: (o: boolean) => void }) {
  const { data } = useQuery({
    enabled: !!id,
    queryKey: ["article-detail", id],
    queryFn: async () => {
      const [{ data: art, error: e1 }, { data: fios, error: e2 }] = await Promise.all([
        supabase.from("articles").select("*").eq("id", id!).maybeSingle(),
        (supabase.from("article_fios" as any) as any).select("id, fio_descricao, qtd_cones, porcentagem").eq("article_id", id!),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { art: art as ArticleDetail | null, fios: (fios ?? []) as ArticleFio[] };
    },
  });

  const art = data?.art ?? null;
  const fios = data?.fios ?? [];
  const fmt = (v: number | null | undefined, d = 2) => (v == null ? "" : Number(v).toFixed(d));

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b bg-primary/10 px-4 py-2">
          <DialogTitle className="text-sm font-semibold text-primary">Detalhes do Artigo</DialogTitle>
        </DialogHeader>

        {!art ? (
          <div className="p-8 text-center text-muted-foreground">Carregando…</div>
        ) : (
          <div className="max-h-[75vh] overflow-auto">
            <div className="grid grid-cols-2 gap-x-4 p-3">
              <div>
                <Row label="Código:" value={art.codigo} />
                <Row label="Composicao:" value={art.composicao} />
                <Row label="Artigo:" value={art.nome} />
                <Row label="NCM:" value={art.ncm} />
                <Row label="Origem:" value={art.origem} />
                <Row label="FCI:" value={art.fci} />
                <Row label="Cliente:" value={art.cliente} />
                <Row label="P. Acabamento:" value={art.p_acabamento} />
                <Row label="Gramatura:" value={fmt(art.gramatura, 0)} />
                <Row label="LFA:" value={fmt(art.lfa, 0)} />
                <Row label="Tipo Máquina:" value={art.tipo_maquina} />
                <Row label="Finura:" value={fmt(art.finura, 0)} />
                <Row label="Disposição Agulhas:" value={art.disposicao_agulhas} />
                <Row label="Nº Voltas:" value={fmt(art.n_voltas, 0)} />
                <Row label="R$ Malharia:" value={fmt(art.r_malharia)} />
                <Row label="R$ Custo:" value={fmt(art.r_custo)} />
                <Row label="R$ Venda:" value={fmt(art.r_venda)} />
              </div>
              <div>
                <Row label="Tipo:" value={art.tipo} />
                <Row label="" value="" />
                <Row label="" value="" />
                <Row label="CEST:" value={art.cest} />
                <Row label="" value="" />
                <Row label="" value="" />
                <Row label="" value="" />
                <Row label="Largura:" value={fmt(art.largura)} />
                <Row label="Rendimento:" value={fmt(art.rendimento)} />
                <Row label="Falha Agulha:" value={art.falha_agulha ? "Sim" : "Não"} />
                <Row label="Diametro:" value={fmt(art.diametro, 0)} />
                <Row label="Nº Alimentadores:" value={fmt(art.n_alimentadores, 0)} />
                <Row label="RPM:" value={fmt(art.rpm, 0)} />
                <Row label="" value="" />
                <Row label="R$ Malharia Compl.:" value={fmt(art.r_malharia_compl)} />
                <Row label="" value="" />
                <Row label="R$ Venda Metros:" value={fmt(art.r_venda_metros)} />
              </div>
            </div>

            <div className="px-3 pb-2">
              <Row label="Observação:" value={art.observacao} />
              <Row label="Imagem:" value={art.imagem_url ? <a href={art.imagem_url} target="_blank" rel="noreferrer" className="text-primary underline">Abrir</a> : "—"} />
            </div>

            <div className="mt-2 border-t bg-primary/10 px-3 py-2 text-center text-sm font-semibold text-primary">
              COMPOSIÇÃO FIO
            </div>
            <div className="p-3">
              <table className="w-full border text-sm">
                <thead className="bg-primary/10">
                  <tr>
                    <th className="border p-2 text-left">Fio</th>
                    <th className="border p-2 text-right w-28">Qtd. Cones</th>
                    <th className="border p-2 text-right w-28">Porcentagem</th>
                  </tr>
                </thead>
                <tbody>
                  {fios.length === 0 ? (
                    <tr><td colSpan={3} className="p-3 text-center text-muted-foreground">Nenhum fio cadastrado</td></tr>
                  ) : fios.map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="border p-2">{f.fio_descricao}</td>
                      <td className="border p-2 text-right">{Number(f.qtd_cones).toFixed(0)}</td>
                      <td className="border p-2 text-right">{Number(f.porcentagem).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
