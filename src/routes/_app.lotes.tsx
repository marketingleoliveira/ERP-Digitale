import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/lotes")({
  ssr: false,
  component: LotesPage,
});

type TipoLote = "tecido" | "fio";

type Lote = {
  id: string;
  tipo: TipoLote;
  item_id: string;
  numero_lote: string;
  quantidade: number;
  quantidade_disponivel: number;
  data_entrada: string;
  fornecedor_id: string | null;
  observacao: string | null;
  habilitado: boolean;
};

type ItemRef = { id: string; codigo: string | null; nome: string | null };
type Fornecedor = { id: string; nome_fantasia: string };

const PAGE_SIZE = 20;

async function fetchLotes(): Promise<Lote[]> {
  const { data, error } = await supabase
    .from("lotes" as never)
    .select("*")
    .order("data_entrada", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Lote[];
}

async function fetchArticles(): Promise<ItemRef[]> {
  const { data, error } = await supabase.from("articles").select("id, codigo, nome").order("codigo");
  if (error) throw error;
  return (data ?? []) as unknown as ItemRef[];
}
async function fetchFios(): Promise<ItemRef[]> {
  const { data, error } = await supabase.from("fios").select("id, codigo, nome").order("codigo");
  if (error) throw error;
  return (data ?? []) as unknown as ItemRef[];
}
async function fetchFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from("tinturarias")
    .select("id, nome_fantasia, categoria")
    .neq("categoria", "Insumos")
    .order("nome_fantasia");
  if (error) throw error;
  return (data ?? []) as unknown as Fornecedor[];
}

function LotesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["lotes"], queryFn: fetchLotes });
  const { data: articles = [] } = useQuery({ queryKey: ["articles-ref"], queryFn: fetchArticles });
  const { data: fios = [] } = useQuery({ queryKey: ["fios-ref"], queryFn: fetchFios });
  const { data: fornecedores = [] } = useQuery({ queryKey: ["fornecedores-ref"], queryFn: fetchFornecedores });

  const itemMap = useMemo(() => {
    const m = new Map<string, ItemRef>();
    for (const a of articles) m.set(`tecido:${a.id}`, a);
    for (const f of fios) m.set(`fio:${f.id}`, f);
    return m;
  }, [articles, fios]);
  const fornecedorMap = useMemo(
    () => new Map(fornecedores.map((f) => [f.id, f.nome_fantasia])),
    [fornecedores],
  );

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("__all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lote | null>(null);

  const filtered = useMemo(() => {
    return data.filter((l) => {
      const item = itemMap.get(`${l.tipo}:${l.item_id}`);
      const hay = `${l.numero_lote} ${item?.codigo ?? ""} ${item?.nome ?? ""}`.toLowerCase();
      const okTxt = hay.includes(applied.toLowerCase());
      const okTipo = tipoFilter === "__all" || l.tipo === tipoFilter;
      return okTxt && okTipo;
    });
  }, [data, applied, tipoFilter, itemMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [selected, setSelected] = useState<string | null>(null);
  const selectedRow = data.find((l) => l.id === selected) ?? null;

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("lotes" as never) as never as {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
      }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lote excluído.");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["lotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🏷️ Controle de Lotes</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedRow} onClick={() => { setEditing(selectedRow); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedRow || deleteMut.isPending} onClick={() => selectedRow && deleteMut.mutate(selectedRow.id)}>
            <Trash2 className="h-4 w-4 mr-1.5" />EXCLUIR
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-primary-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Item</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Nº Lote</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Qtd.</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Disponível</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Entrada</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Fornecedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Nenhum lote cadastrado.</TableCell></TableRow>
              ) : paged.map((l) => {
                const item = itemMap.get(`${l.tipo}:${l.item_id}`);
                return (
                  <TableRow key={l.id} onClick={() => setSelected(selected === l.id ? null : l.id)} className={selected === l.id ? "bg-muted/60 cursor-pointer" : "cursor-pointer"}>
                    <TableCell>
                      <input type="radio" checked={selected === l.id} onChange={() => setSelected(l.id)} />
                    </TableCell>
                    <TableCell><span className="inline-flex rounded bg-muted px-2 py-0.5 text-xs uppercase">{l.tipo}</span></TableCell>
                    <TableCell><span className="text-primary font-medium">{item?.codigo ?? "—"}</span> {item?.nome ?? ""}</TableCell>
                    <TableCell className="font-medium">{l.numero_lote}</TableCell>
                    <TableCell className="text-right">{Number(l.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</TableCell>
                    <TableCell className="text-right">{Number(l.quantidade_disponivel).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</TableCell>
                    <TableCell>{l.data_entrada}</TableCell>
                    <TableCell>{l.fornecedor_id ? fornecedorMap.get(l.fornecedor_id) ?? "—" : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border p-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">Página: {page} / {totalPages}</span>
            <div className="mx-auto flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>◀ ANTERIOR</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>PRÓXIMO ▶</Button>
            </div>
            <span className="ml-auto text-muted-foreground">Total: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Buscar (lote / código / nome):</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <div className="min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Tipo:</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos</SelectItem>
                  <SelectItem value="tecido">Tecido</SelectItem>
                  <SelectItem value="fio">Fio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <LoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        articles={articles}
        fios={fios}
        fornecedores={fornecedores}
        onSaved={() => qc.invalidateQueries({ queryKey: ["lotes"] })}
      />
    </div>
  );
}

function LoteDialog({
  open, onOpenChange, editing, articles, fios, fornecedores, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Lote | null;
  articles: ItemRef[]; fios: ItemRef[]; fornecedores: Fornecedor[]; onSaved: () => void;
}) {
  const [tipo, setTipo] = useState<TipoLote>("tecido");
  const [itemId, setItemId] = useState("");
  const [numero, setNumero] = useState("");
  const [qtd, setQtd] = useState("");
  const [disp, setDisp] = useState("");
  const [data, setData] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [forn, setForn] = useState<string>("__none");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!open) return;
    setTipo(editing?.tipo ?? "tecido");
    setItemId(editing?.item_id ?? "");
    setNumero(editing?.numero_lote ?? "");
    setQtd(editing?.quantidade?.toString() ?? "");
    setDisp(editing?.quantidade_disponivel?.toString() ?? "");
    setData(editing?.data_entrada ?? new Date().toISOString().slice(0, 10));
    setForn(editing?.fornecedor_id ?? "__none");
    setObs(editing?.observacao ?? "");
  }, [open, editing]);

  const opts = tipo === "tecido" ? articles : fios;

  const mut = useMutation({
    mutationFn: async () => {
      if (!itemId) throw new Error("Selecione o item.");
      if (!numero.trim()) throw new Error("Informe o número do lote.");
      const q = Number(qtd.replace(",", "."));
      if (!Number.isFinite(q) || q < 0) throw new Error("Quantidade inválida.");
      const d = disp.trim() ? Number(disp.replace(",", ".")) : q;
      if (!Number.isFinite(d) || d < 0) throw new Error("Disponível inválido.");
      const payload = {
        tipo,
        item_id: itemId,
        numero_lote: numero.trim(),
        quantidade: q,
        quantidade_disponivel: d,
        data_entrada: data,
        fornecedor_id: forn === "__none" ? null : forn,
        observacao: obs.trim() || null,
      };
      const table = supabase.from("lotes" as never) as never as {
        insert: (p: unknown) => Promise<{ error: Error | null }>;
        update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
      };
      if (editing) {
        const { error } = await table.update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await table.insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Lote atualizado." : "Lote cadastrado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🏷️ {editing ? "Alterar" : "Cadastro"} de Lote</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded bg-muted/50 p-5">
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Tipo:</Label>
            <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoLote); setItemId(""); }} disabled={!!editing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tecido">Tecido</SelectItem>
                <SelectItem value="fio">Fio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Item:</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {opts.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.codigo ?? "—"} — {o.nome ?? ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Nº do Lote:</Label>
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de Entrada:</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Quantidade:</Label>
            <Input value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Disponível (padrão = Quantidade):</Label>
            <Input value={disp} onChange={(e) => setDisp(e.target.value)} placeholder={qtd} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Fornecedor:</Label>
            <Select value={forn} onValueChange={setForn}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__none">—</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Observação:</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} maxLength={500} />
          </div>
        </div>
        <p className="text-center text-sm text-destructive">* Campo Obrigatório</p>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {editing ? "SALVAR" : "CADASTRAR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
