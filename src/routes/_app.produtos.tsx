import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus2, Image as ImageIcon, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/produtos")({
  ssr: false,
  component: ProdutosPage,
});

type FichaItem = { produto_id: string; produto_nome: string; quantidade: number; valor_compra: number };

type Product = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string | null;
  ncm: string | null;
  cest: string | null;
  origem: string | null;
  unidade: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  estoque_minimo: number | null;
  img1_path: string | null;
  img2_path: string | null;
  observacao: string | null;
  composicao: string | null;
  largura: number | null;
  gramatura: number | null;
  rendimento: number | null;
  area_peca: number | null;
  qtd_pecas_kg: number | null;
  peso_padrao_peca: number | null;
  ficha_tecnica: FichaItem[] | null;
  ativo: boolean;
};

const PAGE_SIZE = 20;
const TIPOS = ["Produtos", "Outros"];
const ORIGENS = ["0 - Nacional", "1 - Estrangeira - Importação direta", "2 - Estrangeira - Adquirida no mercado interno"];
const UNIDADES = ["UN", "KG", "MT", "M2", "PC", "CX", "LT"];

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
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
                  <TableCell><span className="text-primary">{p.nome}</span></TableCell>
                  <TableCell>{p.unidade ?? "—"}</TableCell>
                  <TableCell className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-4 w-4 opacity-40" /></TableCell>
                  <TableCell className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-4 w-4 opacity-40" /></TableCell>
                  <TableCell className="text-center"><Checkbox checked={p.ativo} disabled /></TableCell>
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
        products={data}
        onSaved={() => qc.invalidateQueries({ queryKey: ["products"] })}
      />
      <ProdutoDetailDialog produto={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}

const emptyForm = {
  codigo: "", tipo: "Produtos", nome: "", ncm: "", cest: "", origem: "",
  unidade: "UN", preco_custo: "", preco_venda: "", estoque_minimo: "",
  observacao: "", composicao: "",
  largura: "", gramatura: "", rendimento: "", area_peca: "", qtd_pecas_kg: "", peso_padrao_peca: "",
  ativo: true,
};

function num(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function ProdutoDialog({
  open,
  onOpenChange,
  editing,
  products,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Product | null;
  products: Product[];
  onSaved: () => void;
}) {
  const [f, setF] = useState({ ...emptyForm });
  const [ficha, setFicha] = useState<FichaItem[]>([]);
  const [fProdId, setFProdId] = useState("");
  const [fQtd, setFQtd] = useState("");
  const [fValor, setFValor] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setF({
        codigo: editing.codigo ?? "",
        tipo: editing.tipo ?? "Produtos",
        nome: editing.nome ?? "",
        ncm: editing.ncm ?? "",
        cest: editing.cest ?? "",
        origem: editing.origem ?? "",
        unidade: editing.unidade ?? "UN",
        preco_custo: editing.preco_custo?.toString() ?? "",
        preco_venda: editing.preco_venda?.toString() ?? "",
        estoque_minimo: editing.estoque_minimo?.toString() ?? "",
        observacao: editing.observacao ?? "",
        composicao: editing.composicao ?? "",
        largura: editing.largura?.toString() ?? "",
        gramatura: editing.gramatura?.toString() ?? "",
        rendimento: editing.rendimento?.toString() ?? "",
        area_peca: editing.area_peca?.toString() ?? "",
        qtd_pecas_kg: editing.qtd_pecas_kg?.toString() ?? "",
        peso_padrao_peca: editing.peso_padrao_peca?.toString() ?? "",
        ativo: editing.ativo,
      });
      setFicha(Array.isArray(editing.ficha_tecnica) ? editing.ficha_tecnica : []);
    } else {
      setF({ ...emptyForm });
      setFicha([]);
    }
    setFProdId(""); setFQtd(""); setFValor("");
  }, [open, editing]);

  const addFicha = () => {
    const p = products.find((x) => x.id === fProdId);
    const q = num(fQtd); const v = num(fValor);
    if (!p) return toast.error("Selecione um produto.");
    if (q == null || q <= 0) return toast.error("Informe a quantidade.");
    if (v == null || v < 0) return toast.error("Informe o valor de compra.");
    setFicha((prev) => [...prev, { produto_id: p.id, produto_nome: p.nome, quantidade: q, valor_compra: v }]);
    setFProdId(""); setFQtd(""); setFValor("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        codigo: f.codigo.trim(),
        tipo: f.tipo,
        nome: f.nome.trim(),
        ncm: f.ncm.trim() || null,
        cest: f.cest.trim() || null,
        origem: f.origem || null,
        unidade: f.unidade || null,
        preco_custo: num(f.preco_custo),
        preco_venda: num(f.preco_venda),
        estoque_minimo: num(f.estoque_minimo),
        observacao: f.observacao.trim() || null,
        composicao: f.composicao.trim() || null,
        largura: num(f.largura),
        gramatura: num(f.gramatura),
        rendimento: num(f.rendimento),
        area_peca: num(f.area_peca),
        qtd_pecas_kg: num(f.qtd_pecas_kg),
        peso_padrao_peca: num(f.peso_padrao_peca),
        ficha_tecnica: ficha,
        ativo: f.ativo,
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
    if (!f.codigo.trim() || !f.nome.trim() || !f.ncm.trim() || !f.origem || !f.unidade) {
      toast.error("Preencha os campos obrigatórios (*).");
      return;
    }
    mut.mutate();
  };

  const fichaTotal = ficha.reduce((s, i) => s + i.quantidade * i.valor_compra, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">🌸 {editing ? "Alterar" : "Cadastro"} Produto</DialogTitle>
        </DialogHeader>

        <div className="rounded bg-muted/50 p-5 space-y-4">
          {/* Linha 1: Código + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Código" required>
              <Input value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} maxLength={20} className="max-w-[220px]" />
            </Field>
            <Field label="Tipo" required>
              <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
                <SelectTrigger className="max-w-[220px]"><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Produto" required>
            <Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={200} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="NCM" required>
              <Input value={f.ncm} onChange={(e) => setF({ ...f, ncm: e.target.value })} maxLength={20} className="max-w-[220px]" />
            </Field>
            <Field label="CEST">
              <Input value={f.cest} onChange={(e) => setF({ ...f, cest: e.target.value })} maxLength={20} className="max-w-[220px]" />
            </Field>
            <Field label="Origem" required>
              <Select value={f.origem} onValueChange={(v) => setF({ ...f, origem: v })}>
                <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>{ORIGENS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Unidade" required>
              <Select value={f.unidade} onValueChange={(v) => setF({ ...f, unidade: v })}>
                <SelectTrigger className="max-w-[220px]"><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>{UNIDADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Valor Compra R$">
              <Input value={f.preco_custo} onChange={(e) => setF({ ...f, preco_custo: e.target.value })} className="max-w-[160px]" />
            </Field>
            <Field label="Valor Venda R$">
              <Input value={f.preco_venda} onChange={(e) => setF({ ...f, preco_venda: e.target.value })} className="max-w-[160px]" />
            </Field>
            <Field label="Estoque Mínimo">
              <Input value={f.estoque_minimo} onChange={(e) => setF({ ...f, estoque_minimo: e.target.value })} className="max-w-[160px]" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Imagem"><Input type="file" disabled title="Upload manual (a implementar)" /></Field>
            <Field label="Imagem 2"><Input type="file" disabled title="Upload manual (a implementar)" /></Field>
          </div>
          <p className="text-xs text-muted-foreground">Formatos pdf, jpg, jpeg, bmp e gif. Tamanho máximo 5 MB.</p>

          <Field label="Observação">
            <Textarea value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} rows={3} />
          </Field>

          {/* FICHA TÉCNICA */}
          <div className="pt-2">
            <h3 className="text-center text-destructive font-semibold mb-3">FICHA TÉCNICA</h3>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_180px_auto] gap-3 items-end">
              <Field label="Produto" required>
                <Select value={fProdId} onValueChange={setFProdId}>
                  <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                  <SelectContent>
                    {products.filter((p) => !editing || p.id !== editing.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Quantidade" required>
                <Input value={fQtd} onChange={(e) => setFQtd(e.target.value)} />
              </Field>
              <Field label="Valor Compra R$" required>
                <Input value={fValor} onChange={(e) => setFValor(e.target.value)} />
              </Field>
              <Button type="button" variant="secondary" onClick={addFicha}>INSERIR</Button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted-foreground/70 hover:bg-muted-foreground/70">
                    <TableHead className="text-white">Produto</TableHead>
                    <TableHead className="text-white text-right w-24">Qtd.</TableHead>
                    <TableHead className="text-white text-right w-32">R$ Compra</TableHead>
                    <TableHead className="text-white text-right w-32">R$ Total</TableHead>
                    <TableHead className="text-white text-center w-20">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ficha.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Nenhum item.</TableCell></TableRow>
                  ) : ficha.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{it.produto_nome}</TableCell>
                      <TableCell className="text-right">{it.quantidade}</TableCell>
                      <TableCell className="text-right">{it.valor_compra.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(it.quantidade * it.valor_compra).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Button size="icon" variant="ghost" onClick={() => setFicha((p) => p.filter((_, i) => i !== idx))}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ficha.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                      <TableCell className="text-right font-semibold">{fichaTotal.toFixed(2)}</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Field label="Composição">
            <Input value={f.composicao} onChange={(e) => setF({ ...f, composicao: e.target.value })} maxLength={300} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldSuffix label="Largura" suffix="Metros">
              <Input value={f.largura} onChange={(e) => setF({ ...f, largura: e.target.value })} className="max-w-[140px]" />
            </FieldSuffix>
            <FieldSuffix label="Gramatura" suffix="Gramas/m2">
              <Input value={f.gramatura} onChange={(e) => setF({ ...f, gramatura: e.target.value })} className="max-w-[140px]" />
            </FieldSuffix>
            <FieldSuffix label="Rendimento" suffix="Metros/Kg">
              <Input value={f.rendimento} onChange={(e) => setF({ ...f, rendimento: e.target.value })} className="max-w-[140px]" />
            </FieldSuffix>
            <FieldSuffix label="Área Peça" suffix="Metros">
              <Input value={f.area_peca} onChange={(e) => setF({ ...f, area_peca: e.target.value })} className="max-w-[140px]" />
            </FieldSuffix>
            <FieldSuffix label="Qtd. Peças Kg" suffix="">
              <Input value={f.qtd_pecas_kg} onChange={(e) => setF({ ...f, qtd_pecas_kg: e.target.value })} className="max-w-[140px]" />
            </FieldSuffix>
            <FieldSuffix label="Peso Padrão Peça" suffix="Kg">
              <Input value={f.peso_padrao_peca} onChange={(e) => setF({ ...f, peso_padrao_peca: e.target.value })} className="max-w-[140px]" />
            </FieldSuffix>
          </div>

          {editing && (
            <label className="flex items-center gap-2">
              <Checkbox checked={f.ativo} onCheckedChange={(v) => setF({ ...f, ativo: !!v })} />
              <span className="text-sm">Habilitado</span>
            </label>
          )}
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-3">
      <Label className="text-sm justify-self-end">
        {required && <span className="text-destructive mr-1">*</span>}
        {label}:
      </Label>
      <div>{children}</div>
    </div>
  );
}

function FieldSuffix({ label, suffix, children }: { label: string; suffix: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-3">
      <Label className="text-sm justify-self-end">{label}:</Label>
      <div className="flex items-center gap-2">
        {children}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
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
          <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-sm">
            <span className="font-semibold text-primary">Código:</span><span>{produto.codigo}</span>
            <span className="font-semibold text-primary">NCM:</span><span>{produto.ncm ?? "—"}</span>
            <span className="font-semibold text-primary">CEST:</span><span>{produto.cest ?? "—"}</span>
            <span className="font-semibold text-primary">Origem:</span><span>{produto.origem ?? "—"}</span>
            <span className="font-semibold text-primary">Tipo:</span><span>{produto.tipo ?? "—"}</span>
            <span className="font-semibold text-primary">Produto:</span><span>{produto.nome}</span>
            <span className="font-semibold text-primary">Unidade:</span><span>{produto.unidade ?? "—"}</span>
            <span className="font-semibold text-primary">Vl Compra:</span><span>{produto.preco_custo ?? "—"}</span>
            <span className="font-semibold text-primary">Vl Venda:</span><span>{produto.preco_venda ?? "—"}</span>
            <span className="font-semibold text-primary">Composição:</span><span>{produto.composicao ?? "—"}</span>
            <span className="font-semibold text-primary">Habilitado:</span><span>{produto.ativo ? "Sim" : "Não"}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
