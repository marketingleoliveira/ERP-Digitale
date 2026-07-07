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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Printer, Building2 } from "lucide-react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/digitale-logo.png.asset.json";

export const Route = createFileRoute("/_app/empresa")({
  ssr: false,
  component: EmpresaPage,
});

type Empresa = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  cpf: string | null;
  telefone: string | null;
  contato: string | null;
  tipo_cliente: string | null;
  flag_cliente: boolean;
  flag_fiador: boolean;
  flag_malha: boolean;
  flag_acabamento: boolean;
  flag_confeccao: boolean;
  flag_importador: boolean;
  flag_fornecedor: boolean;
  flag_transportadora: boolean;
  flag_representante: boolean;
  flag_habilitado: boolean;
};

const FLAG_COLS: Array<{ key: keyof Empresa; label: string; title: string }> = [
  { key: "flag_cliente", label: "Cli", title: "Cliente" },
  { key: "flag_fiador", label: "Fia", title: "Fiador" },
  { key: "flag_malha", label: "Mal", title: "Malharia" },
  { key: "flag_acabamento", label: "Aca", title: "Acabamento" },
  { key: "flag_confeccao", label: "Con", title: "Confecção" },
  { key: "flag_importador", label: "Imp", title: "Importador" },
  { key: "flag_fornecedor", label: "For", title: "Fornecedor" },
  { key: "flag_transportadora", label: "Tra", title: "Transportadora" },
  { key: "flag_representante", label: "Rep", title: "Representante" },
  { key: "flag_habilitado", label: "Hab", title: "Habilitado" },
];

const SELECT_COLS =
  "id, razao_social, nome_fantasia, cnpj, cpf, telefone, contato, tipo_cliente, flag_cliente, flag_fiador, flag_malha, flag_acabamento, flag_confeccao, flag_importador, flag_fornecedor, flag_transportadora, flag_representante, flag_habilitado";

function EmpresaPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");

  const [filters, setFilters] = useState({ nome: "", cnpj: "", cpf: "", tipo: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("customers") as any)
        .select(SELECT_COLS)
        .order("nome_fantasia", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Empresa[];
    },
  });

  const filtered = useMemo(() => {
    return empresas.filter((e) => {
      if (filters.nome && !`${e.nome_fantasia ?? ""} ${e.razao_social ?? ""}`.toLowerCase().includes(filters.nome.toLowerCase())) return false;
      if (filters.cnpj && !(e.cnpj ?? "").includes(filters.cnpj)) return false;
      if (filters.cpf && !(e.cpf ?? "").includes(filters.cpf)) return false;
      if (filters.tipo && e.tipo_cliente !== filters.tipo) return false;
      return true;
    });
  }, [empresas, filters]);

  const selected = filtered.find((e) => e.id === selectedId) ?? null;

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<Empresa>) => {
      if (editing?.id) {
        const { error } = await (supabase.from("customers") as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("customers") as any).insert({
          ...payload,
          owner_id: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setDialogOpen(false);
      setEditing(null);
      toast.success("Empresa salva");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setSelectedId(null);
      setDeleteOpen(false);
      toast.success("Empresa excluída");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = () => {
    if (!selected) return toast.info("Selecione uma empresa");
    setEditing(selected); setDialogOpen(true);
  };
  const askDelete = () => {
    if (!selected) return toast.info("Selecione uma empresa");
    if (!isDev) return toast.error("Apenas o Desenvolvedor pode excluir");
    setDeleteOpen(true);
  };

  const handlePrint = async () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    // logo
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
    doc.text("Listagem de Empresas", 150, 45);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 150, 60);
    doc.setTextColor(0);

    const body = filtered.map((e) => [
      e.nome_fantasia ?? e.razao_social ?? "-",
      e.cnpj ?? e.cpf ?? "-",
      e.telefone ?? "-",
      e.contato ?? "-",
      ...FLAG_COLS.map((c) => ((e[c.key] as boolean) ? "●" : "○")),
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Nome Fantasia", "CNPJ/CPF", "Telefone", "Contato", ...FLAG_COLS.map((c) => c.label)]],
      body,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Página ${doc.getCurrentPageInfo().pageNumber} / ${pageCount}  •  Total: ${filtered.length} empresas`,
          40,
          doc.internal.pageSize.getHeight() - 20,
        );
      },
    });

    doc.save(`empresas-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Listagem Empresa</h1>
      </div>

      <Card className="overflow-hidden">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-b bg-muted/40 p-2">
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="h-4 w-4" /> Cadastrar
          </Button>
          <Button size="sm" variant="outline" onClick={openEdit} disabled={!selected}>
            <Pencil className="h-4 w-4" /> Alterar
          </Button>
          <Button size="sm" variant="outline" onClick={askDelete} disabled={!selected}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="w-8 p-2"></th>
                <th className="p-2 text-left">Nome Fantasia</th>
                <th className="p-2 text-left">CNPJ/CPF</th>
                <th className="p-2 text-left">Telefone</th>
                <th className="p-2 text-left">Contato</th>
                {FLAG_COLS.map((c) => (
                  <th key={c.key} title={c.title} className="p-2 text-center text-xs w-10">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5 + FLAG_COLS.length} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5 + FLAG_COLS.length} className="p-6 text-center text-muted-foreground">Nenhuma empresa encontrada</td></tr>
              ) : filtered.map((e) => {
                const isSel = e.id === selectedId;
                return (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    onDoubleClick={() => { setEditing(e); setDialogOpen(true); }}
                    className={`cursor-pointer border-b hover:bg-muted/50 ${isSel ? "bg-primary/10" : ""}`}
                  >
                    <td className="p-2"><Checkbox checked={isSel} onCheckedChange={() => setSelectedId(e.id)} /></td>
                    <td className="p-2 font-medium text-primary">{e.nome_fantasia || e.razao_social || "—"}</td>
                    <td className="p-2 font-mono text-xs">{e.cnpj || e.cpf || "—"}</td>
                    <td className="p-2">{e.telefone || "—"}</td>
                    <td className="p-2">{e.contato || "—"}</td>
                    {FLAG_COLS.map((c) => (
                      <td key={c.key} className="p-2 text-center">
                        <span className={`inline-block h-3 w-3 rounded-full ${e[c.key] ? "bg-emerald-500" : "bg-rose-400"}`} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Filters */}
        <div className="grid gap-3 border-t bg-muted/40 p-3 md:grid-cols-5">
          <div>
            <Label className="text-xs">Nome/Razão</Label>
            <Input value={filters.nome} onChange={(e) => setFilters({ ...filters, nome: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">CNPJ</Label>
            <Input value={filters.cnpj} onChange={(e) => setFilters({ ...filters, cnpj: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">CPF</Label>
            <Input value={filters.cpf} onChange={(e) => setFilters({ ...filters, cpf: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={filters.tipo || "all"} onValueChange={(v) => setFilters({ ...filters, tipo: v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={() => { /* filters are live */ }}>
              Filtrar
            </Button>
          </div>
        </div>

        <div className="border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Total de Registros: {filtered.length}
        </div>
      </Card>

      <EmpresaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empresa={editing}
        onSave={(p) => saveMut.mutate(p)}
        saving={saveMut.isPending}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.nome_fantasia || selected?.razao_social} — esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selected && deleteMut.mutate(selected.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmpresaDialog({
  open, onOpenChange, empresa, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  empresa: Empresa | null;
  onSave: (p: Partial<Empresa>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Empresa>>({});

  useEffect(() => {
    if (open) {
      setForm(empresa ?? {
        flag_cliente: true, flag_habilitado: true,
        flag_fiador: false, flag_malha: false, flag_acabamento: false,
        flag_confeccao: false, flag_importador: false, flag_fornecedor: false,
        flag_transportadora: false, flag_representante: false,
      });
    }
  }, [open, empresa]);

  const set = <K extends keyof Empresa>(k: K, v: Empresa[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{empresa ? "Alterar Empresa" : "Cadastrar Empresa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Razão Social</Label>
            <Input value={form.razao_social ?? ""} onChange={(e) => set("razao_social", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Nome Fantasia</Label>
            <Input value={form.nome_fantasia ?? ""} onChange={(e) => set("nome_fantasia", e.target.value)} />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={form.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} />
          </div>
          <div>
            <Label>Contato</Label>
            <Input value={form.contato ?? ""} onChange={(e) => set("contato", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-2 block">Categorias</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3 md:grid-cols-5">
              {FLAG_COLS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(form[c.key])}
                    onCheckedChange={(v) => set(c.key, Boolean(v) as never)}
                  />
                  {c.title}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
