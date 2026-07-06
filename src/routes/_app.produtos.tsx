import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Package, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useAuth, useUserRoles } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/produtos")({ component: ProdutosPage });

type Product = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string | null;
  tipo: string | null;
  composicao: string | null;
  gramatura: number | null;
  largura: number | null;
  unidade: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  ncm: string | null;
  ativo: boolean;
};

const fmtBRL = (v: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const baseColumns: Column<Product>[] = [
  { key: "codigo", header: "Código", className: "font-mono text-xs" },
  {
    key: "nome", header: "Produto", sortable: true, render: (r) => (
      <div>
        <p className="font-medium">{r.nome}</p>
        <p className="text-xs text-muted-foreground">
          {[r.composicao, r.gramatura ? `${r.gramatura}g/m²` : null, r.largura ? `${r.largura}m` : null]
            .filter(Boolean).join(" • ") || "—"}
        </p>
      </div>
    ),
  },
  {
    key: "categoria", header: "Categoria",
    render: (r) => r.categoria ? <Badge variant="outline">{r.categoria}</Badge> : "—",
  },
  { key: "tipo", header: "Tipo", render: (r) => r.tipo ?? "—" },
  { key: "unidade", header: "Un.", className: "text-center", render: (r) => r.unidade ?? "—" },
  {
    key: "preco_venda", header: "Preço venda", className: "text-right tabular-nums",
    render: (r) => fmtBRL(r.preco_venda),
  },
  {
    key: "ativo", header: "Status", render: (r) => (
      <Badge className={r.ativo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
        {r.ativo ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

const emptyForm = {
  codigo: "", nome: "", categoria: "", tipo: "", composicao: "",
  gramatura: "", largura: "", unidade: "un", preco_custo: "", preco_venda: "", ncm: "",
};

function ProdutosPage() {
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const canDelete = roles.includes("desenvolvedor");

  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const columns = useMemo<Column<Product>[]>(() => {
    if (!canDelete) return baseColumns;
    return [
      ...baseColumns,
      {
        key: "actions", header: "", className: "text-right w-16",
        render: (r) => (
          <Button
            variant="ghost" size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setToDelete(r)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ];
  }, [canDelete]);

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Produto "${toDelete.nome}" excluído`);
    setToDelete(null);
    load();
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("nome");
    if (error) toast.error(error.message); else setRows((data ?? []) as Product[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      categoria: form.categoria || null,
      tipo: form.tipo || null,
      composicao: form.composicao || null,
      gramatura: form.gramatura ? Number(form.gramatura) : null,
      largura: form.largura ? Number(form.largura) : null,
      unidade: form.unidade || null,
      preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
      preco_venda: form.preco_venda ? Number(form.preco_venda) : null,
      ncm: form.ncm || null,
      ativo: true,
    };
    const { error } = await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto cadastrado");
    setOpen(false);
    setForm(emptyForm);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos (Insumos)"
        description="Insumos para confecção e dia a dia da empresa — matérias-primas, aviamentos, embalagens e serviços. Para tecidos prontos, use o menu Artigos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1.5" />Novo produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo produto</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input required value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="m">Metro (m)</SelectItem>
                      <SelectItem value="kg">Quilograma (kg)</SelectItem>
                      <SelectItem value="pç">Peça (pç)</SelectItem>
                      <SelectItem value="rl">Rolo (rl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Nome *</Label>
                  <Input required value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matéria-prima">Matéria-prima</SelectItem>
                      <SelectItem value="Aviamento">Aviamento</SelectItem>
                      <SelectItem value="Embalagem">Embalagem</SelectItem>
                      <SelectItem value="Linha / Fio">Linha / Fio</SelectItem>
                      <SelectItem value="Etiqueta">Etiqueta</SelectItem>
                      <SelectItem value="Uso e Consumo">Uso e Consumo</SelectItem>
                      <SelectItem value="Serviço">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo / Subcategoria</Label>
                  <Input placeholder="Malha PV, Oxford, Suplex…" value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Composição</Label>
                  <Input placeholder="67% PES / 33% VIS" value={form.composicao}
                    onChange={(e) => setForm({ ...form, composicao: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Gramatura (g/m²)</Label>
                  <Input type="number" step="0.01" value={form.gramatura}
                    onChange={(e) => setForm({ ...form, gramatura: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Largura (m)</Label>
                  <Input type="number" step="0.01" value={form.largura}
                    onChange={(e) => setForm({ ...form, largura: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Preço de custo</Label>
                  <Input type="number" step="0.01" value={form.preco_custo}
                    onChange={(e) => setForm({ ...form, preco_custo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Preço de venda</Label>
                  <Input type="number" step="0.01" value={form.preco_venda}
                    onChange={(e) => setForm({ ...form, preco_venda: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>NCM</Label>
                  <Input value={form.ncm}
                    onChange={(e) => setForm({ ...form, ncm: e.target.value })} />
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Nenhum produto cadastrado"
          description="Clique em “Novo produto” para começar a cadastrar seu catálogo."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchKeys={["codigo", "nome", "categoria", "tipo", "composicao"]}
        />
      )}
    </div>
  );
}
