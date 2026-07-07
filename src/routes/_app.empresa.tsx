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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

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

  const selectedList = filtered.filter((e) => selectedIds.has(e.id));
  const selected = selectedList.length === 1 ? selectedList[0] : null;
  const allSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map((e) => e.id)) : new Set());
  };

  const saveMut = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
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
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase
        .from("customers")
        .delete()
        .in("id", ids)
        .select("id");
      if (error) throw error;
      const deleted = (data ?? []).length;
      if (deleted === 0) {
        throw new Error("Nenhuma empresa foi excluída. Verifique suas permissões.");
      }
      return { deleted, requested: ids.length };
    },
    onSuccess: ({ deleted, requested }) => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setSelectedIds(new Set());
      setDeleteOpen(false);
      toast.success(
        deleted === requested
          ? `${deleted} empresa(s) excluída(s)`
          : `${deleted} de ${requested} excluída(s) — demais bloqueadas por permissão`,
      );
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = () => {
    if (!selected) return toast.info("Selecione exatamente uma empresa para alterar");
    setEditing(selected); setDialogOpen(true);
  };
  const askDelete = () => {
    if (selectedList.length === 0) return toast.info("Selecione ao menos uma empresa");
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
          <Button size="sm" variant="outline" onClick={askDelete} disabled={selectedList.length === 0}>
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
                <th className="w-8 p-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => toggleAll(!!v)}
                    aria-label="Selecionar todas"
                  />
                </th>
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
                const isSel = selectedIds.has(e.id);
                return (
                  <tr
                    key={e.id}
                    onDoubleClick={() => setViewingId(e.id)}
                    className={`cursor-pointer border-b hover:bg-muted/50 ${isSel ? "bg-primary/10" : ""}`}
                  >
                    <td className="p-2" onClick={(ev) => ev.stopPropagation()}>
                      <Checkbox checked={isSel} onCheckedChange={(v) => toggleOne(e.id, !!v)} />
                    </td>
                    <td className="p-2 font-medium text-primary underline-offset-2 hover:underline" onClick={() => setViewingId(e.id)}>
                      {e.nome_fantasia || e.razao_social || "—"}
                    </td>
                    <td className="p-2 font-mono text-xs" onClick={() => toggleOne(e.id, !isSel)}>{e.cnpj || e.cpf || "—"}</td>
                    <td className="p-2" onClick={() => toggleOne(e.id, !isSel)}>{e.telefone || "—"}</td>
                    <td className="p-2" onClick={() => toggleOne(e.id, !isSel)}>{e.contato || "—"}</td>
                    {FLAG_COLS.map((c) => (
                      <td key={c.key} className="p-2 text-center" onClick={() => toggleOne(e.id, !isSel)}>
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
            <AlertDialogTitle>
              Excluir {selectedList.length} empresa(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedList.slice(0, 5).map((e) => e.nome_fantasia || e.razao_social).join(", ")}
              {selectedList.length > 5 ? "…" : ""} — esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate(selectedList.map((e) => e.id))}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ArtigoVenda = { artigo: string; valor: number };

function EmpresaDialog({
  open, onOpenChange, empresa, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  empresa: Empresa | null;
  onSave: (p: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [artigos, setArtigos] = useState<ArtigoVenda[]>([]);
  const [novoArtigo, setNovoArtigo] = useState<ArtigoVenda>({ artigo: "", valor: 0 });

  useEffect(() => {
    if (!open) return;
    if (empresa) {
      setForm(empresa as any);
      setArtigos(Array.isArray((empresa as any).artigos_venda) ? (empresa as any).artigos_venda : []);
    } else {
      setForm({
        pais: "BRASIL",
        flag_cliente: true, flag_habilitado: true,
        flag_fiador: false, flag_malha: false, flag_acabamento: false,
        flag_confeccao: false, flag_importador: false, flag_fornecedor: false,
        flag_transportadora: false, flag_representante: false,
      });
      setArtigos([]);
    }
    setNovoArtigo({ artigo: "", valor: 0 });
  }, [open, empresa]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const TIPO_EMPRESA: Array<{ key: keyof Empresa; label: string }> = [
    { key: "flag_cliente", label: "Cliente" },
    { key: "flag_malha", label: "Fiação" },
    { key: "flag_malha", label: "Malharia" },
    { key: "flag_acabamento", label: "Acabamento" },
    { key: "flag_confeccao", label: "Confecção" },
    { key: "flag_importador", label: "Importador" },
    { key: "flag_fornecedor", label: "Fornecedor" },
    { key: "flag_transportadora", label: "Transportadora" },
    { key: "flag_representante", label: "Representante" },
  ];

  const handleSubmit = () => {
    onSave({ ...form, artigos_venda: artigos });
  };

  const addArtigo = () => {
    if (!novoArtigo.artigo) return;
    setArtigos((a) => [...a, novoArtigo]);
    setNovoArtigo({ artigo: "", valor: 0 });
  };

  const inp = "h-8 text-sm";
  const lbl = "text-xs font-medium";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Building2 className="h-4 w-4" />
            {empresa ? "Alterar Empresa" : "Cadastrar Empresa"}
          </DialogTitle>
        </DialogHeader>

        {/* Dados principais */}
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-3">
            <Label className={lbl}>* Nome Fantasia</Label>
            <Input className={inp} value={form.nome_fantasia ?? ""} onChange={(e) => set("nome_fantasia", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Label className={lbl}>* Razão Social</Label>
            <Input className={inp} value={form.razao_social ?? ""} onChange={(e) => set("razao_social", e.target.value)} />
          </div>
          <div className="md:col-span-6">
            <Label className={lbl}>Matriz</Label>
            <Input className={inp} placeholder="Digite no mínimo as três primeiras letras do matriz" value={form.matriz ?? ""} onChange={(e) => set("matriz", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label className={lbl}>CNPJ</Label>
            <Input className={inp} value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className={lbl}>IE</Label>
            <Input className={inp} value={form.inscricao_estadual ?? ""} onChange={(e) => set("inscricao_estadual", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>CPF</Label>
            <Input className={inp} value={form.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>RG</Label>
            <Input className={inp} value={form.rg ?? ""} onChange={(e) => set("rg", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label className={lbl}>SUFRAMA</Label>
            <Input className={inp} value={form.suframa ?? ""} onChange={(e) => set("suframa", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className={lbl}>* CEP</Label>
            <Input className={inp} value={form.cep ?? ""} onChange={(e) => set("cep", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className={lbl}>Bairro</Label>
            <Input className={inp} value={form.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} />
          </div>

          <div className="md:col-span-4">
            <Label className={lbl}>* Endereço</Label>
            <Input className={inp} value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>Número</Label>
            <Input className={inp} value={form.numero ?? ""} onChange={(e) => set("numero", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>Complemento</Label>
            <Input className={inp} value={form.complemento ?? ""} onChange={(e) => set("complemento", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label className={lbl}>* Cidade</Label>
            <Input className={inp} value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>** Cid. Cód.</Label>
            <Input className={inp} value={form.cidade_codigo ?? ""} onChange={(e) => set("cidade_codigo", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>* UF</Label>
            <Input className={inp} value={form.uf ?? ""} onChange={(e) => set("uf", e.target.value.toUpperCase())} maxLength={2} />
          </div>
          <div className="md:col-span-2">
            <Label className={lbl}>* País</Label>
            <Input className={inp} value={form.pais ?? "BRASIL"} onChange={(e) => set("pais", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label className={lbl}>** Telefone</Label>
            <Input className={inp} value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className={lbl}>Celular</Label>
            <Input className={inp} value={form.celular ?? ""} onChange={(e) => set("celular", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className={lbl}>Email</Label>
            <Input className={inp} type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <Label className={lbl}>Contato</Label>
            <Input className={inp} value={form.contato ?? ""} onChange={(e) => set("contato", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Label className={lbl}>Representante</Label>
            <Input className={inp} value={form.sales_rep_id ?? ""} onChange={(e) => set("sales_rep_id", e.target.value || null)} placeholder="[SELECIONE]" />
          </div>

          <div className="md:col-span-2">
            <Label className={lbl}>Comissão (%)</Label>
            <Input className={inp} type="number" step="0.01" value={form.comissao ?? ""} onChange={(e) => set("comissao", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="md:col-span-3">
            <Label className={lbl}>Transportadora</Label>
            <Input className={inp} value={form.transportadora_id ?? ""} onChange={(e) => set("transportadora_id", e.target.value || null)} placeholder="[SELECIONE]" />
          </div>
          <div className="md:col-span-1">
            <Label className={lbl}>Peça Tara Kg</Label>
            <Input className={inp} type="number" step="0.01" value={form.peca_tara_kg ?? ""} onChange={(e) => set("peca_tara_kg", e.target.value ? Number(e.target.value) : null)} />
          </div>

          <div className="md:col-span-6">
            <Label className={lbl}>Observação</Label>
            <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.observacao ?? ""} onChange={(e) => set("observacao", e.target.value)} />
          </div>
        </div>

        {/* Endereço Entrega */}
        <div className="mt-2">
          <h3 className="mb-2 text-center text-sm font-semibold text-primary">Endereço Entrega</h3>
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label className={lbl}>CEP</Label>
              <Input className={inp} value={form.entrega_cep ?? ""} onChange={(e) => set("entrega_cep", e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <Label className={lbl}>UF</Label>
              <Input className={inp} value={form.entrega_uf ?? ""} onChange={(e) => set("entrega_uf", e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div className="md:col-span-3" />
            <div className="md:col-span-4">
              <Label className={lbl}>Endereço</Label>
              <Input className={inp} value={form.entrega_endereco ?? ""} onChange={(e) => set("entrega_endereco", e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <Label className={lbl}>Número</Label>
              <Input className={inp} value={form.entrega_numero ?? ""} onChange={(e) => set("entrega_numero", e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <Label className={lbl}>Complemento</Label>
              <Input className={inp} value={form.entrega_complemento ?? ""} onChange={(e) => set("entrega_complemento", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className={lbl}>Bairro</Label>
              <Input className={inp} value={form.entrega_bairro ?? ""} onChange={(e) => set("entrega_bairro", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className={lbl}>Cidade</Label>
              <Input className={inp} value={form.entrega_cidade ?? ""} onChange={(e) => set("entrega_cidade", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className={lbl}>Cidade Código</Label>
              <Input className={inp} value={form.entrega_cidade_codigo ?? ""} onChange={(e) => set("entrega_cidade_codigo", e.target.value)} />
            </div>
            <div className="md:col-span-6">
              <Label className={lbl}>Observação Financeiro</Label>
              <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.observacao_financeiro ?? ""} onChange={(e) => set("observacao_financeiro", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Tipo Empresa */}
        <div className="mt-2">
          <h3 className="mb-2 text-center text-sm font-semibold text-primary">TIPO EMPRESA</h3>
          <div className="flex flex-wrap justify-center gap-4 rounded-md border p-3">
            {TIPO_EMPRESA.map((t, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <Checkbox checked={Boolean(form[t.key])} onCheckedChange={(v) => set(t.key as string, Boolean(v))} />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* Dados Cliente */}
        <div className="mt-2">
          <h3 className="mb-2 text-center text-sm font-semibold text-primary">DADOS CLIENTE</h3>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <Label className={lbl}>Tipo Cliente</Label>
              <Input className={inp} value={form.tipo_cliente ?? ""} onChange={(e) => set("tipo_cliente", e.target.value)} placeholder="[SELECIONE]" />
            </div>
            <div>
              <Label className={lbl}>Segmento Cliente</Label>
              <Input className={inp} value={form.segmento_cliente ?? ""} onChange={(e) => set("segmento_cliente", e.target.value)} placeholder="[SELECIONE]" />
            </div>
            <div>
              <Label className={lbl}>CRT</Label>
              <Input className={inp} value={form.crt ?? ""} onChange={(e) => set("crt", e.target.value)} placeholder="[SELECIONE]" />
            </div>
            <div>
              <Label className={lbl}>ICMS</Label>
              <Input className={inp} type="number" step="0.01" value={form.icms ?? ""} onChange={(e) => set("icms", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label className={lbl}>Tipo Pagamento</Label>
              <Input className={inp} value={form.tipo_pagamento ?? ""} onChange={(e) => set("tipo_pagamento", e.target.value)} placeholder="[SELECIONE]" />
            </div>
            <div>
              <Label className={lbl}>R$ Limite</Label>
              <Input className={inp} type="number" step="0.01" value={form.limite_credito ?? ""} onChange={(e) => set("limite_credito", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label className={lbl}>Tabela Prazo</Label>
              <Input className={inp} value={form.tabela_prazo ?? ""} onChange={(e) => set("tabela_prazo", e.target.value)} placeholder="[SELECIONE]" />
            </div>
            <div>
              <Label className={lbl}>Prazo</Label>
              <Input className={inp} type="number" value={form.prazo ?? ""} onChange={(e) => set("prazo", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label className={lbl}>Intervalo</Label>
              <Input className={inp} type="number" value={form.intervalo ?? ""} onChange={(e) => set("intervalo", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label className={lbl}>Parcelas</Label>
              <Input className={inp} type="number" value={form.parcelas ?? ""} onChange={(e) => set("parcelas", e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
        </div>

        {/* Artigo Valor Venda */}
        <div className="mt-2">
          <h3 className="mb-2 text-center text-sm font-semibold text-primary">ARTIGO VALOR VENDA</h3>
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-3">
              <Label className={lbl}>* Artigo</Label>
              <Input className={inp} value={novoArtigo.artigo} onChange={(e) => setNovoArtigo({ ...novoArtigo, artigo: e.target.value })} placeholder="[SELECIONE]" />
            </div>
            <div className="md:col-span-2">
              <Label className={lbl}>* Valor R$</Label>
              <Input className={inp} type="number" step="0.01" value={novoArtigo.valor || ""} onChange={(e) => setNovoArtigo({ ...novoArtigo, valor: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button type="button" size="sm" variant="secondary" className="w-full" onClick={addArtigo}>Inserir</Button>
            </div>
          </div>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Artigo</th>
                <th className="p-2 text-right">Valor</th>
                <th className="p-2 text-center w-16">Remover</th>
              </tr>
            </thead>
            <tbody>
              {artigos.length === 0 ? (
                <tr><td colSpan={3} className="p-3 text-center text-muted-foreground">Nenhum artigo</td></tr>
              ) : artigos.map((a, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{a.artigo}</td>
                  <td className="p-2 text-right">R$ {Number(a.valor).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => setArtigos(artigos.filter((_, j) => j !== i))} className="text-destructive hover:underline">
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
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando…" : (empresa ? "Salvar" : "Cadastrar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
