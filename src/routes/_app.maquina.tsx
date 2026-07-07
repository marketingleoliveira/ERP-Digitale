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
import { FilePlus2, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/maquina")({
  ssr: false,
  component: MaquinaPage,
});

type CargaAgulha = { agulha: string; quantidade: number };
type Maquina = {
  id: string;
  numero: number;
  tipo: string;
  maquina: string;
  modelo: string | null;
  habilitado: boolean;
  n_alimentadores?: number | null;
  diametro?: number | null;
  finura?: number | null;
  disposicao_agulhas?: string | null;
  producao_media?: number | null;
  carga_agulhas?: CargaAgulha[] | null;
  fio_id?: string | null;
};

const PAGE_SIZE = 20;
const TIPOS = ["Dupla Frontura", "1/2 Malha", "Estampa", "Corte", "Costura", "Outros"];

async function fetchMaquinas(): Promise<Maquina[]> {
  const { data, error } = await supabase
    .from("maquinas" as never)
    .select("*")
    .order("numero", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Maquina[];
}

function MaquinaPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["maquinas"], queryFn: fetchMaquinas });

  const [filterNumero, setFilterNumero] = useState("");
  const [filterMaquina, setFilterMaquina] = useState("");
  const [appliedNumero, setAppliedNumero] = useState("");
  const [appliedMaquina, setAppliedMaquina] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Maquina | null>(null);

  const filtered = useMemo(
    () =>
      data.filter((m) => {
        const nOk = !appliedNumero || String(m.numero).includes(appliedNumero.trim());
        const mOk = m.maquina.toLowerCase().includes(appliedMaquina.toLowerCase());
        return nOk && mOk;
      }),
    [data, appliedNumero, appliedMaquina],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedRow = data.find((m) => m.id === selected) ?? null;

  const deleteMut = useMutation({
    mutationFn: async (row: Maquina) => {
      const { error } = await supabase.from("maquinas" as never).delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Máquina excluída.");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["maquinas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🌸 Listagem Maquina</h1>

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
                <TableHead className="text-primary-foreground font-semibold">Número</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Máquina</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Modelo</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Checkbox checked={selected === m.id} onCheckedChange={(c) => setSelected(c ? m.id : null)} />
                  </TableCell>
                  <TableCell><span className="text-primary font-medium">{m.numero}</span></TableCell>
                  <TableCell>{m.tipo}</TableCell>
                  <TableCell>{m.maquina}</TableCell>
                  <TableCell>{m.modelo ?? "—"}</TableCell>
                  <TableCell className="text-center"><Checkbox checked={m.habilitado} disabled /></TableCell>
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
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Número:</Label>
              <Input value={filterNumero} onChange={(e) => setFilterNumero(e.target.value)} className="h-9" maxLength={10} />
            </div>
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Máquina:</Label>
              <Input value={filterMaquina} onChange={(e) => setFilterMaquina(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setAppliedNumero(filterNumero); setAppliedMaquina(filterMaquina); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <MaquinaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["maquinas"] })}
      />
    </div>
  );
}

function MaquinaDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Maquina | null; onSaved: () => void;
}) {
  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState("");
  const [maquina, setMaquina] = useState("");
  const [modelo, setModelo] = useState("");
  const [nAlim, setNAlim] = useState("");
  const [diametro, setDiametro] = useState("");
  const [finura, setFinura] = useState("");
  const [disposicao, setDisposicao] = useState("");
  const [prodMedia, setProdMedia] = useState("");
  const [habilitado, setHabilitado] = useState(true);
  const [carga, setCarga] = useState<CargaAgulha[]>([]);
  const [agulha, setAgulha] = useState("");
  const [qtd, setQtd] = useState("");

  const { data: agulhasOptions = [] } = useQuery({
    queryKey: ["agulhas", "enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agulhas" as never)
        .select("agulha,habilitado")
        .order("agulha", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown as { agulha: string; habilitado: boolean }[])
        .filter((a) => a.habilitado)
        .map((a) => a.agulha);
    },
  });

  useEffect(() => {
    if (!open) return;
    setNumero(editing?.numero?.toString() ?? "");
    setTipo(editing?.tipo ?? "");
    setMaquina(editing?.maquina ?? "");
    setModelo(editing?.modelo ?? "");
    setNAlim(editing?.n_alimentadores?.toString() ?? "");
    setDiametro(editing?.diametro?.toString() ?? "");
    setFinura(editing?.finura?.toString() ?? "");
    setDisposicao(editing?.disposicao_agulhas ?? "");
    setProdMedia(editing?.producao_media?.toString() ?? "");
    setHabilitado(editing?.habilitado ?? true);
    setCarga(Array.isArray(editing?.carga_agulhas) ? editing!.carga_agulhas! : []);
    setAgulha(""); setQtd("");
  }, [open, editing]);

  const numOrNull = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const addCarga = () => {
    const q = numOrNull(qtd);
    if (!agulha.trim()) return toast.error("Informe a agulha.");
    if (q == null || q <= 0) return toast.error("Informe a quantidade.");
    setCarga((p) => [...p, { agulha: agulha.trim(), quantidade: q }]);
    setAgulha(""); setQtd("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const n = Number(numero);
      if (!Number.isInteger(n) || n <= 0) throw new Error("Número inválido.");
      const nAlimN = numOrNull(nAlim);
      const payload = {
        numero: n, tipo, maquina: maquina.trim(), modelo: modelo.trim() || null,
        n_alimentadores: nAlimN != null ? Math.trunc(nAlimN) : null,
        diametro: numOrNull(diametro),
        finura: numOrNull(finura),
        disposicao_agulhas: disposicao.trim() || null,
        producao_media: numOrNull(prodMedia),
        carga_agulhas: carga,
        habilitado,
      };
      const client = supabase as unknown as { from: (t: string) => { update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> }; insert: (p: unknown) => Promise<{ error: Error | null }> } };
      if (editing) {
        const { error } = await client.from("maquinas").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from("maquinas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Máquina atualizada." : "Máquina cadastrada.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!numero.trim() || !tipo || !maquina.trim()) {
      toast.error("Preencha os campos obrigatórios (*).");
      return;
    }
    mut.mutate();
  };

  const Row = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="grid grid-cols-[150px_1fr] items-center gap-3">
      <Label className="justify-self-end text-sm">
        {required && <span className="text-destructive mr-1">*</span>}{label}:
      </Label>
      <div>{children}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">🌸 {editing ? "Alterar" : "Cadastro"} Máquina</DialogTitle>
        </DialogHeader>
        <div className="rounded bg-muted/50 p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <Row label="Número" required>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} className="max-w-[160px]" />
            </Row>
            <Row label="Tipo" required>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="h-9 rounded border border-input bg-background px-2 text-sm max-w-[220px]"
              >
                <option value="">[SELECIONE]</option>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Row>
            <Row label="Máquina" required>
              <Input value={maquina} onChange={(e) => setMaquina(e.target.value)} maxLength={100} />
            </Row>
            <div />
            <Row label="Modelo">
              <Input value={modelo} onChange={(e) => setModelo(e.target.value)} maxLength={100} />
            </Row>
            <Row label="N° Alimentadores">
              <Input value={nAlim} onChange={(e) => setNAlim(e.target.value)} className="max-w-[160px]" />
            </Row>
            <Row label="Diametro">
              <Input value={diametro} onChange={(e) => setDiametro(e.target.value)} className="max-w-[160px]" />
            </Row>
            <Row label="Finura">
              <Input value={finura} onChange={(e) => setFinura(e.target.value)} className="max-w-[160px]" />
            </Row>
            <Row label="Disposição Agulhas">
              <Input value={disposicao} onChange={(e) => setDisposicao(e.target.value)} maxLength={100} />
            </Row>
            <Row label="Produção Média">
              <Input value={prodMedia} onChange={(e) => setProdMedia(e.target.value)} className="max-w-[160px]" />
            </Row>
          </div>

          <div className="pt-3">
            <h3 className="text-center text-destructive font-semibold mb-3">CARGA AGULHAS</h3>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
              <div>
                <Label className="text-sm"><span className="text-destructive mr-1">*</span>Agulha:</Label>
                <select
                  value={agulha}
                  onChange={(e) => setAgulha(e.target.value)}
                  className="h-9 w-full rounded border border-input bg-background px-2 text-sm"
                >
                  <option value="">[SELECIONE]</option>
                  {agulhasOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm"><span className="text-destructive mr-1">*</span>Quantidade:</Label>
                <Input value={qtd} onChange={(e) => setQtd(e.target.value)} />
              </div>
              <Button type="button" variant="secondary" onClick={addCarga}>INSERIR</Button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted-foreground/70 hover:bg-muted-foreground/70">
                    <TableHead className="text-white">Agulha</TableHead>
                    <TableHead className="text-white text-right w-32">Quantidade</TableHead>
                    <TableHead className="text-white text-center w-24">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carga.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Nenhum item.</TableCell></TableRow>
                  ) : carga.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.agulha}</TableCell>
                      <TableCell className="text-right">{c.quantidade}</TableCell>
                      <TableCell className="text-center">
                        <Button size="icon" variant="ghost" onClick={() => setCarga((p) => p.filter((_, k) => k !== i))}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {editing && (
            <Row label="Habilitado">
              <Checkbox checked={habilitado} onCheckedChange={(v) => setHabilitado(!!v)} />
            </Row>
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
