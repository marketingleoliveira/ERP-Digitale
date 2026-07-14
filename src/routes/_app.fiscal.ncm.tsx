import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/fiscal/ncm")({ ssr: false, component: NcmPage });

type Row = {
  codigo: string; descricao: string; cest_sugerido: string | null; ex_tipi: string | null;
  aliq_ipi_padrao: number; cst_ipi_padrao: string | null;
  cst_pis_padrao: string | null; aliq_pis_padrao: number;
  cst_cofins_padrao: string | null; aliq_cofins_padrao: number;
  ativo: boolean;
};

async function fetchAll(): Promise<Row[]> {
  const { data, error } = await supabase.from("ncm_catalogo" as never).select("*").order("codigo");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function NcmPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["ncm_catalogo"], queryFn: fetchAll });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [filtro, setFiltro] = useState("");

  const filtered = useMemo(() =>
    data.filter((r) => r.codigo.includes(filtro) || r.descricao.toLowerCase().includes(filtro.toLowerCase())),
    [data, filtro]);

  const del = useMutation({
    mutationFn: async (codigo: string) => {
      const { error } = await (supabase.from("ncm_catalogo" as never) as never as {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
      }).delete().eq("codigo", codigo);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluído."); qc.invalidateQueries({ queryKey: ["ncm_catalogo"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">📚 Cadastro de NCM</h1>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <FilePlus2 className="h-4 w-4 mr-1.5" />Novo NCM
        </Button>
      </div>
      <Card className="p-3">
        <Input placeholder="Filtrar por código ou descrição…" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="max-w-sm" />
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Código","Descrição","CEST","IPI %","CST IPI","PIS %","CST PIS","COFINS %","CST COFINS","Ações"].map((h) => (
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum NCM cadastrado.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.codigo}>
                <TableCell className="font-mono">{r.codigo}</TableCell>
                <TableCell>{r.descricao}</TableCell>
                <TableCell>{r.cest_sugerido ?? "—"}</TableCell>
                <TableCell>{Number(r.aliq_ipi_padrao).toFixed(2)}</TableCell>
                <TableCell>{r.cst_ipi_padrao ?? "—"}</TableCell>
                <TableCell>{Number(r.aliq_pis_padrao).toFixed(4)}</TableCell>
                <TableCell>{r.cst_pis_padrao ?? "—"}</TableCell>
                <TableCell>{Number(r.aliq_cofins_padrao).toFixed(4)}</TableCell>
                <TableCell>{r.cst_cofins_padrao ?? "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(r.codigo)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <NcmDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function NcmDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Row>({
    codigo: "", descricao: "", cest_sugerido: "", ex_tipi: "",
    aliq_ipi_padrao: 0, cst_ipi_padrao: "50",
    cst_pis_padrao: "01", aliq_pis_padrao: 1.65,
    cst_cofins_padrao: "01", aliq_cofins_padrao: 7.6, ativo: true,
  });

  useEffect(() => {
    if (editing) setForm(editing);
    else setForm({
      codigo: "", descricao: "", cest_sugerido: "", ex_tipi: "",
      aliq_ipi_padrao: 0, cst_ipi_padrao: "50",
      cst_pis_padrao: "01", aliq_pis_padrao: 1.65,
      cst_cofins_padrao: "01", aliq_cofins_padrao: 7.6, ativo: true,
    });
  }, [editing, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await (supabase.from("ncm_catalogo" as never) as never as {
          update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
        }).update(form).eq("codigo", editing.codigo);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("ncm_catalogo" as never) as never as {
          insert: (v: object) => Promise<{ error: Error | null }>;
        }).insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); qc.invalidateQueries({ queryKey: ["ncm_catalogo"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof Row>(k: K, v: Row[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Editar NCM" : "Novo NCM"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Código NCM</Label><Input value={form.codigo} disabled={!!editing} onChange={(e) => set("codigo", e.target.value)} /></div>
          <div><Label>CEST</Label><Input value={form.cest_sugerido ?? ""} onChange={(e) => set("cest_sugerido", e.target.value)} /></div>
          <div className="col-span-2"><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} /></div>
          <div><Label>CST IPI</Label><Input value={form.cst_ipi_padrao ?? ""} onChange={(e) => set("cst_ipi_padrao", e.target.value)} /></div>
          <div><Label>Alíquota IPI %</Label><Input type="number" step="0.01" value={form.aliq_ipi_padrao} onChange={(e) => set("aliq_ipi_padrao", Number(e.target.value))} /></div>
          <div><Label>CST PIS</Label><Input value={form.cst_pis_padrao ?? ""} onChange={(e) => set("cst_pis_padrao", e.target.value)} /></div>
          <div><Label>Alíquota PIS %</Label><Input type="number" step="0.0001" value={form.aliq_pis_padrao} onChange={(e) => set("aliq_pis_padrao", Number(e.target.value))} /></div>
          <div><Label>CST COFINS</Label><Input value={form.cst_cofins_padrao ?? ""} onChange={(e) => set("cst_cofins_padrao", e.target.value)} /></div>
          <div><Label>Alíquota COFINS %</Label><Input type="number" step="0.0001" value={form.aliq_cofins_padrao} onChange={(e) => set("aliq_cofins_padrao", Number(e.target.value))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
