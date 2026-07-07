import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Image as ImageIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/estampa")({
  ssr: false,
  component: EstampaPage,
});

type EstampaRow = {
  id: string;
  codigo: string;
  estampa: string;
  variante: number;
  habilitado: boolean;
  imagem_path: string | null;
};

const PAGE_SIZE = 20;
const BUCKET = "estampas";

async function fetchEstampas(): Promise<EstampaRow[]> {
  const { data, error } = await supabase
    .from("estampas")
    .select("id, codigo, estampa, variante, habilitado, imagem_path")
    .order("codigo", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

function EstampaPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["estampas"], queryFn: fetchEstampas });

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EstampaRow | null>(null);
  const [detail, setDetail] = useState<EstampaRow | null>(null);

  const filtered = useMemo(
    () => data.filter((e) => e.estampa.toLowerCase().includes(applied.toLowerCase())),
    [data, applied],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedRow = data.find((e) => e.id === selected) ?? null;

  const deleteMut = useMutation({
    mutationFn: async (row: EstampaRow) => {
      if (row.imagem_path) await supabase.storage.from(BUCKET).remove([row.imagem_path]);
      const { error } = await supabase.from("estampas").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estampa excluída.");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["estampas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🌸 Listagem Estampa</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 p-2">
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
                <TableHead className="text-primary-foreground font-semibold">Estampa</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Variante</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Checkbox checked={selected === e.id} onCheckedChange={(v) => setSelected(v ? e.id : null)} />
                  </TableCell>
                  <TableCell>
                    <button className="text-primary hover:underline font-medium" onClick={() => setDetail(e)}>
                      {e.codigo}
                    </button>
                  </TableCell>
                  <TableCell>{e.estampa}</TableCell>
                  <TableCell className="text-right">{e.variante}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={e.habilitado} disabled />
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
              <Label className="text-xs text-muted-foreground">Estampa:</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <EstampaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["estampas"] })}
      />
      <EstampaDetailDialog row={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}

function EstampaDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: EstampaRow | null;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [estampa, setEstampa] = useState("");
  const [variante, setVariante] = useState("1");
  const [habilitado, setHabilitado] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCodigo(editing?.codigo ?? "");
      setEstampa(editing?.estampa ?? "");
      setVariante(editing ? String(editing.variante) : "1");
      setHabilitado(editing?.habilitado ?? true);
      setFile(null);
      setPreviewUrl(null);
      if (editing?.imagem_path) getSignedUrl(editing.imagem_path).then(setPreviewUrl);
    }
  }, [open, editing]);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter até 2MB."); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!codigo.trim() || !estampa.trim()) { toast.error("Preencha Código e Estampa."); return; }
    const v = Number(variante);
    if (!Number.isInteger(v) || v < 1) { toast.error("Variante deve ser um número inteiro >= 1."); return; }

    setSaving(true);
    try {
      let imagem_path = editing?.imagem_path ?? null;

      if (file) {
        const ext = file.name.split(".").pop() ?? "png";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        if (editing?.imagem_path) await supabase.storage.from(BUCKET).remove([editing.imagem_path]);
        imagem_path = path;
      }

      const payload = {
        codigo: codigo.trim(),
        estampa: estampa.trim(),
        variante: v,
        habilitado,
        imagem_path,
      };

      if (editing) {
        const { error } = await supabase.from("estampas").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Estampa atualizada.");
      } else {
        const { error } = await supabase.from("estampas").insert(payload);
        if (error) throw error;
        toast.success("Estampa cadastrada.");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🌸 {editing ? "Alterar" : "Cadastro"} Estampa</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cod"><span className="text-destructive">*</span> Código:</Label>
            <Input id="cod" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="var"><span className="text-destructive">*</span> Variante:</Label>
            <Input id="var" type="number" min={1} value={variante} onChange={(e) => setVariante(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="est"><span className="text-destructive">*</span> Estampa:</Label>
            <Input id="est" value={estampa} onChange={(e) => setEstampa(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="img">Imagem:</Label>
            <Input id="img" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="mt-2 h-40 w-40 rounded border border-border object-cover" />
            )}
          </div>
          <label className="flex items-center gap-2 md:col-span-2">
            <Checkbox checked={habilitado} onCheckedChange={(v) => setHabilitado(!!v)} />
            <span className="text-sm">Habilitado</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EstampaDetailDialog({ row, onOpenChange }: { row: EstampaRow | null; onOpenChange: (v: boolean) => void }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    setImgUrl(null);
    if (row?.imagem_path) getSignedUrl(row.imagem_path).then(setImgUrl);
  }, [row]);

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-sky-100 dark:bg-sky-950/40">
        <DialogHeader>
          <DialogTitle className="text-primary">Detalhes da Estampa</DialogTitle>
        </DialogHeader>
        {row && (
          <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
            <span className="font-semibold text-primary">Código:</span>
            <span>{row.codigo}</span>
            <span className="font-semibold text-primary">Estampa:</span>
            <span>{row.estampa}</span>
            <span className="font-semibold text-primary">Variante:</span>
            <span>{row.variante}</span>
            <span className="font-semibold text-primary">Imagem:</span>
            <div>
              {imgUrl ? (
                <img src={imgUrl} alt={row.estampa} className="h-56 w-56 rounded border border-border object-cover" />
              ) : (
                <div className="h-56 w-56 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
