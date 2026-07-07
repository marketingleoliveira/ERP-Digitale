import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus2, Image as ImageIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/produtos")({
  ssr: false,
  component: ProdutosPage,
});

type Product = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string | null;
  ncm: string | null;
  unidade: string | null;
  ativo: boolean;
};

const PAGE_SIZE = 20;
const TIPOS = ["Produtos", "Insumos", "Outros"];

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, codigo, nome, tipo, ncm, unidade, ativo")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

function ProdutosPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [filterProduto, setFilterProduto] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("__all");
  const [appliedProduto, setAppliedProduto] = useState("");
  const [appliedTipo, setAppliedTipo] = useState<string>("__all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      data.filter((p) => {
        const pOk = p.nome.toLowerCase().includes(appliedProduto.toLowerCase());
        const tOk = appliedTipo === "__all" || p.tipo === appliedTipo;
        return pOk && tOk;
      }),
    [data, appliedProduto, appliedTipo],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedRow = data.find((p) => p.id === selected) ?? null;

  const deleteMut = useMutation({
    mutationFn: async (row: Product) => {
      const { error } = await supabase.from("products").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído.");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🌸 Listagem Produto</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedRow} onClick={() => { setEditing(selectedRow); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedRow || deleteMut.isPending} onClick={() => selectedRow && deleteMut.mutate(selectedRow)}>
            <Trash2 className="h-4 w-4 mr-1.5" />EXCLUIR
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-primary-foreground font-semibold">Código</TableHead>
                <TableHead className="text-primary-foreground font-semibold">NCM</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Produto</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Unidade</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Img</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Img2</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox checked={selected === p.id} onCheckedChange={(c) => setSelected(c ? p.id : null)} />
                  </TableCell>
                  <TableCell>
                    <button className="text-primary hover:underline font-medium" onClick={() => setDetail(p)}>
                      {p.codigo}
                    </button>
                  </TableCell>
                  <TableCell>{p.ncm ?? "—"}</TableCell>
                  <TableCell>{p.tipo ?? "—"}</TableCell>
                  <TableCell>
                    <span className="text-primary">{p.nome}</span>
                  </TableCell>
                  <TableCell>{p.unidade ?? "—"}</TableCell>
                  <TableCell className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-4 w-4 opacity-40" /></TableCell>
                  <TableCell className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-4 w-4 opacity-40" /></TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={p.ativo} disabled />
                  </TableCell>
                </TableRow>
              ))}
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
            <div className="flex items-center gap-2">
              <span>Página:</span>
              <select
                className="h-8 rounded border border-input bg-background px-2 text-sm"
                value={page}
                onChange={(ev) => setPage(Number(ev.target.value))}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="ml-auto text-muted-foreground">Total de Registros: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Produto:</Label>
              <Input value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <div className="min-w-[180px]">
              <Label className="text-xs text-muted-foreground">Tipo:</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="h-9"><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">[SELECIONE]</SelectItem>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" onClick={() => { setAppliedProduto(filterProduto); setAppliedTipo(filterTipo); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <ProdutoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["products"] })}
      />
      <ProdutoDetailDialog produto={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}

function ProdutoDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Product | null;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [ncm, setNcm] = useState("");
  const [tipo, setTipo] = useState<string>("Produtos");
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (open) {
      setCodigo(editing?.codigo ?? "");
      setNcm(editing?.ncm ?? "");
      setTipo(editing?.tipo ?? "Produtos");
      setNome(editing?.nome ?? "");
      setUnidade(editing?.unidade ?? "UN");
      setAtivo(editing?.ativo ?? true);
    }
  }, [open, editing]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        codigo: codigo.trim(),
        ncm: ncm.trim() || null,
        tipo,
        nome: nome.trim(),
        unidade: unidade.trim() || null,
        ativo,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado." : "Produto cadastrado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!codigo.trim() || !nome.trim()) { toast.error("Preencha Código e Produto."); return; }
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🌸 {editing ? "Alterar" : "Cadastro"} Produto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cod"><span className="text-destructive">*</span> Código:</Label>
            <Input id="cod" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ncm">NCM:</Label>
            <Input id="ncm" value={ncm} onChange={(e) => setNcm(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo:</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="un">Unidade:</Label>
            <Input id="un" value={unidade} onChange={(e) => setUnidade(e.target.value)} maxLength={10} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="nome"><span className="text-destructive">*</span> Produto:</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={200} />
          </div>
          <label className="flex items-center gap-2 md:col-span-2">
            <Checkbox checked={ativo} onCheckedChange={(v) => setAtivo(!!v)} />
            <span className="text-sm">Habilitado</span>
          </label>
        </div>
        <p className="text-center text-sm text-destructive">* Campo Obrigatório</p>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>Cancelar</Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {editing ? "SALVAR" : "CADASTRAR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProdutoDetailDialog({ produto, onOpenChange }: { produto: Product | null; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={!!produto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-sky-100 dark:bg-sky-950/40">
        <DialogHeader>
          <DialogTitle className="text-primary">Detalhes do Produto</DialogTitle>
        </DialogHeader>
        {produto && (
          <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
            <span className="font-semibold text-primary">Código:</span><span>{produto.codigo}</span>
            <span className="font-semibold text-primary">NCM:</span><span>{produto.ncm ?? "—"}</span>
            <span className="font-semibold text-primary">Tipo:</span><span>{produto.tipo ?? "—"}</span>
            <span className="font-semibold text-primary">Produto:</span><span>{produto.nome}</span>
            <span className="font-semibold text-primary">Unidade:</span><span>{produto.unidade ?? "—"}</span>
            <span className="font-semibold text-primary">Habilitado:</span><span>{produto.ativo ? "Sim" : "Não"}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
