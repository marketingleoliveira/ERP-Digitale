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
import { StatusDot } from "@/components/status-dot";

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

  const toggleAtivoMut = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("articles").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
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
      head: [["Código", "NCM", "Descrição", "Rendimento", "Hab"]],
      body: filtered.map((i) => [
        i.codigo ?? "-",
        i.ncm ?? "-",
        i.nome,
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
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-right w-24">Rendimento</th>
                <th className="p-2 text-center w-16">Hab</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum artigo encontrado</td></tr>
              ) : pageItems.map((i) => {
                const isSel = i.id === selectedId;
                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    onDoubleClick={() => { setEditing(i); setDialogOpen(true); }}
                    className={`cursor-pointer border-b hover:bg-muted/50 ${isSel ? "bg-primary/10" : ""} ${!i.ativo ? "bg-destructive/10" : ""}`}
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
                    <td className="p-2 text-right">{i.rendimento != null ? Number(i.rendimento).toFixed(2) : "—"}</td>
                    <td className="p-2 text-center">
                      <StatusDot checked={i.ativo} onToggle={(v) => toggleAtivoMut.mutate({ id: i.id, ativo: v })} />
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
            <Label className="text-xs">Descrição</Label>
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

type FioRow = { id?: string; fio_id?: string | null; fio_descricao: string; qtd_cones: number; porcentagem: number };
type LavRow = { id?: string; lavagem: string; simbolo: string | null };
type CorRow = { id?: string; cor_id: string | null; cor_descricao: string };

const TIPO_OPTS = ["Tecido", "Malha", "Fio", "Aviamento"];
const ORIGEM_OPTS = [
  "0 - Nacional", "1 - Estrangeira - Importação direta",
  "2 - Estrangeira - Adquirida no mercado interno",
  "3 - Nacional > 40% importado", "4 - Nacional produzida por processos básicos",
  "5 - Nacional < 40% importado", "6 - Estrangeira sem similar nacional",
  "7 - Estrangeira adquirida no mercado interno sem similar",
];
const P_ACABAMENTO_OPTS = ["Ramado", "Tinto", "Estampado", "Sanforizado", "Cru"];
const TIPO_MAQUINA_OPTS = ["Circular", "Retilínea", "Máquina Plana", "Interlock", "Jacquard"];
const PONTO_OPTS = ["Alto", "Médio", "Baixo"];
const LAVAGEM_OPTS = ["Lavar à mão", "Lavar à máquina", "Não passar", "Não usar alvejante", "Secar à sombra", "Não torcer", "Passar em temperatura baixa"];

function ArtigoDialog({
  open, onOpenChange, articleId, ownerId, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  articleId: string | null;
  ownerId: string | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [fios, setFios] = useState<FioRow[]>([]);
  const [lavs, setLavs] = useState<LavRow[]>([]);
  const [cores, setCores] = useState<CorRow[]>([]);
  const [novoFio, setNovoFio] = useState<FioRow>({ fio_id: null, fio_descricao: "", qtd_cones: 0, porcentagem: 0 });
  const [novaLav, setNovaLav] = useState<string>("");
  const [novaCor, setNovaCor] = useState<{ id: string; label: string }>({ id: "", label: "" });
  const [saving, setSaving] = useState(false);

  const { data: composicoes = [] } = useQuery({
    enabled: open,
    queryKey: ["composicoes-lookup"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("composicoes" as any) as any)
        .select("id, codigo, tipo, composicao").eq("habilitado", true).order("codigo");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; codigo: string; tipo: string; composicao: string }>;
    },
  });
  const fioOpts = composicoes.filter((c) => c.tipo === "Fio");

  const { data: coresLookup = [] } = useQuery({
    enabled: open,
    queryKey: ["cores-lookup"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("cores" as any) as any)
        .select("id, codigo, descricao").order("codigo");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; codigo: string; descricao: string }>;
    },
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (!articleId) {
        setForm({ ativo: true, origem: "0 - Nacional", p_acabamento: "Ramado", falha_agulha: false });
        setFios([]); setLavs([]); setCores([]);
        return;
      }
      const [{ data: art }, { data: f }, { data: l }, { data: c }] = await Promise.all([
        supabase.from("articles").select("*").eq("id", articleId).maybeSingle(),
        (supabase.from("article_fios" as any) as any).select("*").eq("article_id", articleId),
        (supabase.from("article_lavagens" as any) as any).select("*").eq("article_id", articleId),
        (supabase.from("article_cores" as any) as any).select("*").eq("article_id", articleId),
      ]);
      setForm(art ?? {});
      setFios((f ?? []) as FioRow[]);
      setLavs((l ?? []) as LavRow[]);
      setCores((c ?? []) as CorRow[]);
    })();
  }, [open, articleId]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const porcTotal = fios.reduce((s, f) => s + Number(f.porcentagem || 0), 0);

  const addFio = () => {
    if (!novoFio.fio_descricao) return toast.info("Selecione um fio");
    setFios((a) => [...a, novoFio]);
    setNovoFio({ fio_id: null, fio_descricao: "", qtd_cones: 0, porcentagem: 0 });
  };
  const addLav = () => {
    if (!novaLav) return;
    setLavs((a) => [...a, { lavagem: novaLav, simbolo: null }]);
    setNovaLav("");
  };
  const addCor = () => {
    if (!novaCor.label) return;
    setCores((a) => [...a, { cor_id: novaCor.id || null, cor_descricao: novaCor.label }]);
    setNovaCor({ id: "", label: "" });
  };

  const submit = async () => {
    if (!form.codigo || !form.nome) return toast.error("Preencha Código e Artigo");
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      let id = articleId;
      if (id) {
        const { error } = await (supabase.from("articles") as any).update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("articles")
          .insert({ ...payload, owner_id: ownerId } as any).select("id").single();
        if (error) throw error;
        id = (data as any).id;
      }
      // Replace children
      await Promise.all([
        (supabase.from("article_fios" as any) as any).delete().eq("article_id", id),
        (supabase.from("article_lavagens" as any) as any).delete().eq("article_id", id),
        (supabase.from("article_cores" as any) as any).delete().eq("article_id", id),
      ]);
      if (fios.length) {
        const { error } = await (supabase.from("article_fios" as any) as any)
          .insert(fios.map((f) => ({ article_id: id, fio_id: f.fio_id ?? null, fio_descricao: f.fio_descricao, qtd_cones: f.qtd_cones, porcentagem: f.porcentagem })));
        if (error) throw error;
      }
      if (lavs.length) {
        const { error } = await (supabase.from("article_lavagens" as any) as any)
          .insert(lavs.map((l) => ({ article_id: id, lavagem: l.lavagem, simbolo: l.simbolo })));
        if (error) throw error;
      }
      if (cores.length) {
        const { error } = await (supabase.from("article_cores" as any) as any)
          .insert(cores.map((c) => ({ article_id: id, cor_id: c.cor_id, cor_descricao: c.cor_descricao })));
        if (error) throw error;
      }
      toast.success("Artigo salvo");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const inp = "h-8 text-sm";
  const lbl = "text-xs font-medium";
  const Section = ({ title }: { title: string }) => (
    <h3 className="col-span-full mt-2 border-t pt-2 text-center text-sm font-semibold text-destructive">{title}</h3>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Shirt className="h-4 w-4" /> {articleId ? "Alterar Artigo" : "Cadastrar Artigo"}
          </DialogTitle>
        </DialogHeader>

        {/* Cabeçalho */}
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label className={lbl}><span className="text-destructive">*</span> Código</Label>
            <Input className={inp} value={form.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} />
          </div>
          <div>
            <Label className={lbl}><span className="text-destructive">*</span> Tipo</Label>
            <Select value={form.tipo ?? ""} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>{TIPO_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"></div>

          <div className="md:col-span-4">
            <Label className={lbl}><span className="text-destructive">*</span> Descrição</Label>
            <Input className={inp} value={form.nome ?? ""} onChange={(e) => set("nome", e.target.value)} />
          </div>

          <div>
            <Label className={lbl}><span className="text-destructive">*</span> NCM</Label>
            <Input className={inp} value={form.ncm ?? ""} onChange={(e) => set("ncm", e.target.value)} />
          </div>
          <div>
            <Label className={lbl}>CEST</Label>
            <Input className={inp} value={form.cest ?? ""} onChange={(e) => set("cest", e.target.value)} />
          </div>
          <div>
            <Label className={lbl}><span className="text-destructive">*</span> Origem</Label>
            <Select value={form.origem ?? ""} onValueChange={(v) => set("origem", v)}>
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>{ORIGEM_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className={lbl}>FCI</Label>
            <Input className={inp} value={form.fci ?? ""} onChange={(e) => set("fci", e.target.value)} />
          </div>

          <div>
            <Label className={lbl}><span className="text-destructive">*</span> Largura</Label>
            <Input className={inp} type="number" step="0.01" value={form.largura ?? ""} onChange={(e) => set("largura", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}><span className="text-destructive">*</span> Gramatura</Label>
            <Input className={inp} type="number" step="0.01" value={form.gramatura ?? ""} onChange={(e) => set("gramatura", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Rendimento</Label>
            <Input className={inp} type="number" step="0.01" value={form.rendimento ?? ""} onChange={(e) => set("rendimento", e.target.value === "" ? null : Number(e.target.value))} />
          </div>

          <div>
            <Label className={lbl}>Peso Peça Kg</Label>
            <Input className={inp} type="number" step="0.01" value={form.peso_peca_kg ?? ""} onChange={(e) => set("peso_peca_kg", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Peça Tara Kg</Label>
            <Input className={inp} type="number" step="0.01" value={form.peca_tara_kg ?? ""} onChange={(e) => set("peca_tara_kg", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Falha Agulhas</Label>
            <Select value={form.falha_agulha ? "sim" : "nao"} onValueChange={(v) => set("falha_agulha", v === "sim")}>
              <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Section title="CONFIGURAÇÃO MÁQUINA" />

          <div>
            <Label className={lbl}>Tipo Máquina</Label>
            <Select value={form.tipo_maquina ?? ""} onValueChange={(v) => set("tipo_maquina", v)}>
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>{TIPO_MAQUINA_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className={lbl}>Diâmetro</Label>
            <Input className={inp} type="number" step="0.01" value={form.diametro ?? ""} onChange={(e) => set("diametro", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Finura</Label>
            <Input className={inp} type="number" step="0.01" value={form.finura ?? ""} onChange={(e) => set("finura", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Nº Alimentadores</Label>
            <Input className={inp} type="number" value={form.n_alimentadores ?? ""} onChange={(e) => set("n_alimentadores", e.target.value === "" ? null : Number(e.target.value))} />
          </div>

          <div className="md:col-span-2">
            <Label className={lbl}>Disposição Agulhas</Label>
            <Input className={inp} value={form.disposicao_agulhas ?? ""} onChange={(e) => set("disposicao_agulhas", e.target.value)} />
          </div>
          <div>
            <Label className={lbl}>Qtd Agulhas Cilindro</Label>
            <Input className={inp} type="number" value={form.qtd_agulhas_cilindro ?? ""} onChange={(e) => set("qtd_agulhas_cilindro", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Qtd Agulhas Disco</Label>
            <Input className={inp} type="number" value={form.qtd_agulhas_disco ?? ""} onChange={(e) => set("qtd_agulhas_disco", e.target.value === "" ? null : Number(e.target.value))} />
          </div>

          <div>
            <Label className={lbl}>RPM</Label>
            <Input className={inp} type="number" step="0.01" value={form.rpm ?? ""} onChange={(e) => set("rpm", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Nº Voltas</Label>
            <Input className={inp} type="number" value={form.n_voltas ?? ""} onChange={(e) => set("n_voltas", e.target.value === "" ? null : Number(e.target.value))} />
          </div>

          <Section title="REGULAGEM MÁQUINA" />

          <div className="md:col-span-4 rounded border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left w-8"></th>
                  <th className="p-2 text-left">Alimentador</th>
                  <th className="p-2 text-left">LFA</th>
                  <th className="p-2 text-left">Tensão</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => {
                  const ativo = !!form[`alim_fio_${n}_ativo`];
                  return (
                    <tr key={n} className="border-t">
                      <td className="p-2">
                        <Checkbox
                          checked={ativo}
                          onCheckedChange={(v) => set(`alim_fio_${n}_ativo`, !!v)}
                        />
                      </td>
                      <td className="p-2">Fio alimentador {n}</td>
                      <td className="p-2">
                        <Input
                          className={inp}
                          type="number"
                          step="0.01"
                          disabled={!ativo}
                          value={form[`alim_fio_${n}_lfa`] ?? ""}
                          onChange={(e) => set(`alim_fio_${n}_lfa`, e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className={inp}
                          type="number"
                          step="0.01"
                          disabled={!ativo}
                          value={form[`alim_fio_${n}_tensao`] ?? ""}
                          onChange={(e) => set(`alim_fio_${n}_tensao`, e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


          <div>
            <Label className={lbl}>Ponto Disco</Label>
            <Select value={form.ponto_disco ?? ""} onValueChange={(v) => set("ponto_disco", v)}>
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>{PONTO_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className={lbl}>Ponto Cilindro</Label>
            <Select value={form.ponto_cilindro ?? ""} onValueChange={(v) => set("ponto_cilindro", v)}>
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>{PONTO_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className={lbl}>Roda 1</Label>
            <Input className={inp} type="number" step="0.01" value={form.roda_1 ?? ""} onChange={(e) => set("roda_1", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Roda 2</Label>
            <Input className={inp} type="number" step="0.01" value={form.roda_2 ?? ""} onChange={(e) => set("roda_2", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Roda Lycra</Label>
            <Input className={inp} type="number" step="0.01" value={form.roda_lycra ?? ""} onChange={(e) => set("roda_lycra", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Altura Disco</Label>
            <Input className={inp} type="number" step="0.01" value={form.altura_disco ?? ""} onChange={(e) => set("altura_disco", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>Tensão Lycra</Label>
            <Input className={inp} type="number" step="0.01" value={form.tensao_lycra ?? ""} onChange={(e) => set("tensao_lycra", e.target.value === "" ? null : Number(e.target.value))} />
          </div>

          <div className="md:col-span-4">
            <Label className={lbl}>Imagem (URL)</Label>
            <Input className={inp} value={form.imagem_url ?? ""} onChange={(e) => set("imagem_url", e.target.value)} placeholder="https://…" />
          </div>
          <div className="md:col-span-4">
            <Label className={lbl}>Observação</Label>
            <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.observacao ?? ""} onChange={(e) => set("observacao", e.target.value)} />
          </div>
        </div>

        {/* COMPOSIÇÃO FIO */}
        <h3 className="mt-3 text-center text-sm font-semibold text-destructive">COMPOSIÇÃO FIO</h3>
        <div className="grid gap-3 md:grid-cols-6 rounded border p-3">
          <div className="md:col-span-2">
            <Label className={lbl}><span className="text-destructive">*</span> Fio</Label>
            <Select
              value={novoFio.fio_id ?? ""}
              onValueChange={(v) => {
                const f = fioOpts.find((x) => x.id === v);
                setNovoFio({ ...novoFio, fio_id: v, fio_descricao: f ? `${f.codigo} — ${f.composicao}` : "" });
              }}
            >
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>
                {fioOpts.map((f) => <SelectItem key={f.id} value={f.id}>{f.codigo} — {f.composicao}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={lbl}>Qtd. Cones</Label>
            <Input className={inp} type="number" value={novoFio.qtd_cones || ""} onChange={(e) => setNovoFio({ ...novoFio, qtd_cones: Number(e.target.value) })} />
          </div>
          <div>
            <Label className={lbl}><span className="text-destructive">*</span> Porcentagem</Label>
            <Input className={inp} type="number" step="0.01" value={novoFio.porcentagem || ""} onChange={(e) => setNovoFio({ ...novoFio, porcentagem: Number(e.target.value) })} />
          </div>
          <div>
            <Label className={lbl}>Porcentagem Total</Label>
            <Input className={inp} value={porcTotal.toFixed(2)} readOnly />
          </div>
          <div className="flex items-end">
            <Button type="button" size="sm" variant="secondary" className="w-full" onClick={addFio}>INSERIR</Button>
          </div>
          <table className="md:col-span-6 mt-2 w-full border-collapse text-sm">
            <thead className="bg-muted"><tr>
              <th className="p-2 text-left">Fio</th>
              <th className="p-2 text-right w-24">Qtd. Cones</th>
              <th className="p-2 text-right w-24">Porcentagem</th>
              <th className="p-2 text-center w-16">Remover</th>
            </tr></thead>
            <tbody>
              {fios.length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">Nenhum fio</td></tr>
              ) : fios.map((f, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{f.fio_descricao}</td>
                  <td className="p-2 text-right">{Number(f.qtd_cones).toFixed(0)}</td>
                  <td className="p-2 text-right">{Number(f.porcentagem).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => setFios(fios.filter((_, j) => j !== i))} className="text-destructive">
                      <Trash2 className="inline h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VALORES */}
        <h3 className="mt-3 text-center text-sm font-semibold text-destructive">VALORES</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label className={lbl}>R$ Malharia</Label>
            <Input className={inp} type="number" step="0.01" value={form.r_malharia ?? ""} onChange={(e) => set("r_malharia", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>R$ Malharia Comp.</Label>
            <Input className={inp} type="number" step="0.01" value={form.r_malharia_compl ?? ""} onChange={(e) => set("r_malharia_compl", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>R$ Custo</Label>
            <Input className={inp} type="number" step="0.01" value={form.r_custo ?? ""} onChange={(e) => set("r_custo", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>% Lucro</Label>
            <Input className={inp} type="number" step="0.01" value={form.r_lucro ?? ""} onChange={(e) => set("r_lucro", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>R$ Venda Kg</Label>
            <Input className={inp} type="number" step="0.01" value={form.r_venda ?? ""} onChange={(e) => set("r_venda", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <Label className={lbl}>R$ Venda Metros</Label>
            <Input className={inp} type="number" step="0.01" value={form.r_venda_metros ?? ""} onChange={(e) => set("r_venda_metros", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
        </div>

        {/* INSTRUÇÕES DE LAVAGEM */}
        <h3 className="mt-3 text-center text-sm font-semibold text-destructive">INSTRUÇÕES DE LAVAGEM</h3>
        <div className="grid gap-3 md:grid-cols-6 rounded border p-3">
          <div className="md:col-span-4">
            <Label className={lbl}><span className="text-destructive">*</span> Lavagem</Label>
            <Select value={novaLav} onValueChange={setNovaLav}>
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>{LAVAGEM_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button type="button" size="sm" variant="secondary" className="w-full" onClick={addLav}>INSERIR</Button>
          </div>
          <table className="md:col-span-6 mt-2 w-full border-collapse text-sm">
            <thead className="bg-muted"><tr>
              <th className="p-2 text-left">Lavagem</th>
              <th className="p-2 text-center w-24">Símbolo</th>
              <th className="p-2 text-center w-16">Remover</th>
            </tr></thead>
            <tbody>
              {lavs.length === 0 ? (
                <tr><td colSpan={3} className="p-3 text-center text-muted-foreground">Nenhuma lavagem</td></tr>
              ) : lavs.map((l, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{l.lavagem}</td>
                  <td className="p-2 text-center">{l.simbolo ?? "—"}</td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => setLavs(lavs.filter((_, j) => j !== i))} className="text-destructive">
                      <Trash2 className="inline h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* COR */}
        <h3 className="mt-3 text-center text-sm font-semibold text-destructive">COR</h3>
        <div className="grid gap-3 md:grid-cols-6 rounded border p-3">
          <div className="md:col-span-4">
            <Label className={lbl}><span className="text-destructive">*</span> Cor</Label>
            <Select
              value={novaCor.id}
              onValueChange={(v) => {
                const c = coresLookup.find((x) => x.id === v);
                setNovaCor({ id: v, label: c ? `${c.codigo} — ${c.descricao}` : "" });
              }}
            >
              <SelectTrigger className={inp}><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>
                {coresLookup.map((c) => <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.descricao}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button type="button" size="sm" variant="secondary" className="w-full" onClick={addCor}>INSERIR</Button>
          </div>
          <table className="md:col-span-6 mt-2 w-full border-collapse text-sm">
            <thead className="bg-muted"><tr>
              <th className="p-2 text-left">Cor</th>
              <th className="p-2 text-center w-16">Remover</th>
            </tr></thead>
            <tbody>
              {cores.length === 0 ? (
                <tr><td colSpan={2} className="p-3 text-center text-muted-foreground">Nenhuma cor</td></tr>
              ) : cores.map((c, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{c.cor_descricao}</td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => setCores(cores.filter((_, j) => j !== i))} className="text-destructive">
                      <Trash2 className="inline h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-center text-xs text-destructive">* Campo Obrigatório</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando…" : (articleId ? "Salvar" : "Cadastrar")}</Button>
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
                <Row label="Descrição:" value={art.nome} />
                <Row label="NCM:" value={art.ncm} />
                <Row label="Origem:" value={art.origem} />
                <Row label="FCI:" value={art.fci} />
                <Row label="Gramatura:" value={fmt(art.gramatura, 0)} />
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
                <Row label="CEST:" value={art.cest} />
                <Row label="" value="" />
                <Row label="" value="" />
                <Row label="Largura:" value={fmt(art.largura)} />
                <Row label="Rendimento:" value={fmt(art.rendimento)} />
                <Row label="Falha Agulha:" value={art.falha_agulha ? "Sim" : "Não"} />
                <Row label="Diametro:" value={fmt(art.diametro, 0)} />
                <Row label="Nº Alimentadores:" value={fmt(art.n_alimentadores, 0)} />
                <Row label="RPM:" value={fmt(art.rpm, 0)} />
                <Row label="R$ Malharia Compl.:" value={fmt(art.r_malharia_compl)} />
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
