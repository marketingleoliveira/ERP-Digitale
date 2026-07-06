import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2, Shirt, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { RecordDetailDialog } from "@/components/record-detail-dialog";

export const Route = createFileRoute("/_app/artigos")({ component: ArtigosPage });

type Article = {
  id: string;
  codigo: string | null;
  nome: string;
  slug: string | null;
  categoria: string | null;
  composicao: string | null;
  gramatura: number | null;
  largura: number | null;
  tecnologias: string[] | null;
  descricao_curta: string | null;
  descricao: string | null;
  imagem_url: string | null;
  preco_venda: number | null;
  ativo: boolean;
};

const fmtBRL = (v: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const CATEGORIAS = [
  "Poliamida", "Supermicrofibra", "Moda Praia", "Moda Praia ECO",
  "Fitness", "Suplex", "Malha Técnica", "Emana", "Outros",
];

const emptyForm = {
  codigo: "", nome: "", slug: "", categoria: "", composicao: "",
  gramatura: "", largura: "", tecnologias: "", descricao_curta: "",
  descricao: "", imagem_url: "", preco_venda: "",
};

function ArtigosPage() {
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const canDelete = roles.includes("desenvolvedor");

  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<Article | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("articles").select("*").order("nome");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Article[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      codigo: form.codigo.trim() || null,
      nome: form.nome.trim(),
      slug: form.slug.trim() || form.nome.trim().toLowerCase().replace(/\s+/g, "-"),
      categoria: form.categoria || null,
      composicao: form.composicao || null,
      gramatura: form.gramatura ? Number(form.gramatura) : null,
      largura: form.largura ? Number(form.largura) : null,
      tecnologias: form.tecnologias
        ? form.tecnologias.split(",").map((t) => t.trim()).filter(Boolean)
        : null,
      descricao_curta: form.descricao_curta || null,
      descricao: form.descricao || null,
      imagem_url: form.imagem_url || null,
      preco_venda: form.preco_venda ? Number(form.preco_venda) : null,
      ativo: true,
    };
    const { error } = await supabase.from("articles").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Artigo cadastrado");
    setOpen(false);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("articles").delete().eq("id", toDelete.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Artigo "${toDelete.nome}" excluído`);
    setToDelete(null);
    load();
  };

  const columns: Column<Article>[] = useMemo(() => {
    const base: Column<Article>[] = [
      { key: "codigo", header: "Código", className: "font-mono text-xs" },
      {
        key: "nome", header: "Artigo", sortable: true, render: (r) => (
          <div>
            <p className="font-medium">{r.nome}</p>
            <p className="text-xs text-muted-foreground">
              {[r.composicao, r.gramatura ? `${r.gramatura}g/m²` : null,
                r.largura ? `${r.largura}m` : null].filter(Boolean).join(" • ") ||
                r.descricao_curta || "—"}
            </p>
          </div>
        ),
      },
      {
        key: "categoria", header: "Categoria",
        render: (r) => r.categoria ? <Badge variant="outline">{r.categoria}</Badge> : "—",
      },
      {
        key: "tecnologias", header: "Tecnologias", render: (r) => (
          <div className="flex flex-wrap gap-1">
            {(r.tecnologias ?? []).slice(0, 3).map((t) => (
              <Badge key={t} className="bg-accent/15 text-accent-foreground">{t}</Badge>
            ))}
            {(r.tecnologias?.length ?? 0) > 3 && (
              <Badge variant="outline">+{(r.tecnologias?.length ?? 0) - 3}</Badge>
            )}
          </div>
        ),
      },
      {
        key: "preco_venda", header: "Preço", className: "text-right tabular-nums",
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
    if (canDelete) {
      base.push({
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
      });
    }
    return base;
  }, [canDelete]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artigos"
        description="Tecidos prontos da Digitale Têxtil — Milano, Lyon, Aerodry, Veneza e demais malhas técnicas."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1.5" />Novo artigo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo artigo</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input placeholder="milano" value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Nome do artigo *</Label>
                  <Input required value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preço de venda</Label>
                  <Input type="number" step="0.01" value={form.preco_venda}
                    onChange={(e) => setForm({ ...form, preco_venda: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Composição</Label>
                  <Input placeholder="87% PA / 13% EL" value={form.composicao}
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
                <div className="col-span-2 space-y-2">
                  <Label>Tecnologias (separadas por vírgula)</Label>
                  <Input placeholder="Aloe Vera, Proteção UV 50+, 4 Way Stretch" value={form.tecnologias}
                    onChange={(e) => setForm({ ...form, tecnologias: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição curta</Label>
                  <Input value={form.descricao_curta}
                    onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição completa</Label>
                  <Textarea rows={3} value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>URL da imagem</Label>
                  <Input value={form.imagem_url}
                    onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} />
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
          icon={<Shirt className="h-5 w-5" />}
          title="Nenhum artigo cadastrado"
          description="Clique em “Novo artigo” para cadastrar seus tecidos prontos."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchKeys={["codigo", "nome", "categoria", "composicao", "descricao_curta"]}
          onRowClick={(r) => setSelected(r as unknown as Record<string, unknown>)}
        />
      )}

      <RecordDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={(selected?.nome as string) ?? "Artigo"}
        tableName="articles"
        record={selected}
        textareas={["descricao"]}
        onSaved={load}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O artigo <b>{toDelete?.nome}</b> será removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
