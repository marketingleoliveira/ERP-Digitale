import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cor")({
  ssr: false,
  component: CorPage,
});

type Cor = {
  codigo: string;
  tipo: "Clara" | "Média" | "Escura" | "Especial";
  cor: string;
  valor: number;
  valorComplementar: number;
  habilitado: boolean;
};

const TIPOS: Cor["tipo"][] = ["Clara", "Média", "Escura", "Especial"];

const DATA: Cor[] = [
  { codigo: "863960", tipo: "Clara", cor: "ABACATE", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "47348", tipo: "Escura", cor: "ABISSAL", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "20747", tipo: "Especial", cor: "AÇAI", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "20610", tipo: "Escura", cor: "ADRENALINE", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "AF4", tipo: "Escura", cor: "ALECRIM", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "65973", tipo: "Escura", cor: "ALGA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "20616", tipo: "Média", cor: "ALGODÃO DOCE", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "802260", tipo: "Escura", cor: "ALPINE GREEN", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "344880", tipo: "Média", cor: "ALQUIMIA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "151353", tipo: "Média", cor: "AMBER BROWN", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "16", tipo: "Especial", cor: "AMETISTA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "752791", tipo: "Escura", cor: "ANDORRA - GRUPO SBF", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "606580", tipo: "Clara", cor: "ARGILA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "122", tipo: "Escura", cor: "ASPHALT", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "20749", tipo: "Especial", cor: "ASTRAL", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "19", tipo: "Especial", cor: "ATALAIA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "20895", tipo: "Média", cor: "ATLANTA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "939040", tipo: "Escura", cor: "ATÔMICO", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "25", tipo: "Especial", cor: "AZALEIA", valor: 0, valorComplementar: 0, habilitado: true },
  { codigo: "20566", tipo: "Média", cor: "AZUL", valor: 0, valorComplementar: 0, habilitado: true },
];

const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PAGE_SIZE = 20;

function CorPage() {
  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cor | null>(null);

  const filtered = useMemo(
    () => DATA.filter((c) => c.cor.toLowerCase().includes(applied.toLowerCase())),
    [applied],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedCor = DATA.find((c) => c.codigo === selected) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-primary">🎨 Listagem Cor</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedCor} onClick={() => { setEditing(selectedCor); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedCor} onClick={() => selectedCor && toast.success(`Cor "${selectedCor.cor}" excluída.`)}>
            <Trash2 className="h-4 w-4 mr-1.5" />EXCLUIR
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />IMPRIMIR
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-primary-foreground font-semibold">Código</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Cor</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Valor R$</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Valor R$<br />Complementar</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((c) => (
                <TableRow key={c.codigo}>
                  <TableCell>
                    <Checkbox checked={selected === c.codigo} onCheckedChange={(v) => setSelected(v ? c.codigo : null)} />
                  </TableCell>
                  <TableCell>
                    <button className="text-primary hover:underline font-medium" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                      {c.codigo}
                    </button>
                  </TableCell>
                  <TableCell>{c.tipo}</TableCell>
                  <TableCell>{c.cor}</TableCell>
                  <TableCell className="text-right">{fmt(c.valor)}</TableCell>
                  <TableCell className="text-right">{fmt(c.valorComplementar)}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={c.habilitado} disabled />
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
                onChange={(e) => setPage(Number(e.target.value))}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="ml-auto text-muted-foreground">Total de Registros: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Cor:</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <CadastroCorDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  );
}

function CadastroCorDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Cor | null;
}) {
  const [form, setForm] = useState({
    codigo: "",
    tipo: "" as Cor["tipo"] | "",
    cor: "",
    tinturaria: "",
    valor: "",
    valorComplementar: "",
    observacao: "",
  });

  useMemo(() => {
    if (open) {
      setForm({
        codigo: editing?.codigo ?? "",
        tipo: editing?.tipo ?? "",
        cor: editing?.cor ?? "",
        tinturaria: "",
        valor: editing ? String(editing.valor) : "",
        valorComplementar: editing ? String(editing.valorComplementar) : "",
        observacao: "",
      });
    }
  }, [open, editing]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.codigo.trim() || !form.tipo || !form.cor.trim()) {
      toast.error("Preencha Código, Tipo e Cor.");
      return;
    }
    toast.success(`Cor "${form.cor}" ${editing ? "atualizada" : "cadastrada"}.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><span /></DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🎨 {editing ? "Alterar" : "Cadastro"} Cor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="codigo"><span className="text-destructive">*</span> Código:</Label>
            <Input id="codigo" value={form.codigo} onChange={(e) => set("codigo", e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Tipo:</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v as Cor["tipo"])}>
              <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cor"><span className="text-destructive">*</span> Cor:</Label>
            <Input id="cor" value={form.cor} onChange={(e) => set("cor", e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="tinturaria">Tinturaria:</Label>
            <Input
              id="tinturaria"
              placeholder="Digite no mínimo as três primeiras letras da Tinturaria"
              value={form.tinturaria}
              onChange={(e) => set("tinturaria", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor:</Label>
            <Input id="valor" inputMode="decimal" value={form.valor} onChange={(e) => set("valor", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valorc">Valor Complementar:</Label>
            <Input id="valorc" inputMode="decimal" value={form.valorComplementar} onChange={(e) => set("valorComplementar", e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="obs">Observação:</Label>
            <Textarea id="obs" rows={4} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
