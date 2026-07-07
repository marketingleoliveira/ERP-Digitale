import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/rep-meta")({
  ssr: false,
  component: RepMetaPage,
});

type Rep = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  cpf: string | null;
  telefone: string | null;
  contato: string | null;
  meta_valor: number | null;
};

const PAGE_SIZE = 20;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

async function fetchReps(): Promise<Rep[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,razao_social,nome_fantasia,cnpj,cpf,telefone,contato,meta_valor")
    .eq("flag_representante", true)
    .order("nome_fantasia", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as Rep[];
}

function RepMetaPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["rep-meta"], queryFn: fetchReps });

  const [filterNome, setFilterNome] = useState("");
  const [filterCnpj, setFilterCnpj] = useState("");
  const [appliedNome, setAppliedNome] = useState("");
  const [appliedCnpj, setAppliedCnpj] = useState("");
  const [page, setPage] = useState(1);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const r of data) next[r.id] = r.meta_valor != null ? fmtBRL(Number(r.meta_valor)) : "0,00";
    setEdits(next);
  }, [data]);

  const filtered = useMemo(
    () =>
      data.filter((r) => {
        const nome = `${r.nome_fantasia ?? ""} ${r.razao_social ?? ""}`.toLowerCase();
        const doc = `${r.cnpj ?? ""} ${r.cpf ?? ""}`;
        return (
          nome.includes(appliedNome.toLowerCase()) &&
          doc.includes(appliedCnpj.trim())
        );
      }),
    [data, appliedNome, appliedCnpj],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const parseBRL = (s: string): number => {
    const clean = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const changes = data
        .filter((r) => {
          const current = r.meta_valor != null ? Number(r.meta_valor) : 0;
          const edited = parseBRL(edits[r.id] ?? "");
          return Math.abs(current - edited) > 0.001;
        })
        .map((r) => ({ id: r.id, meta_valor: parseBRL(edits[r.id] ?? "") }));
      if (changes.length === 0) return 0;
      for (const c of changes) {
        const { error } = await supabase
          .from("customers")
          .update({ meta_valor: c.meta_valor })
          .eq("id", c.id);
        if (error) throw error;
      }
      return changes.length;
    },
    onSuccess: (n) => {
      if (n === 0) toast.info("Nenhuma alteração para salvar.");
      else toast.success(`${n} meta(s) atualizada(s).`);
      qc.invalidateQueries({ queryKey: ["rep-meta"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🌸 Listagem Representantes</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            SALVAR METAS
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">Nome Fantasia</TableHead>
                <TableHead className="text-primary-foreground font-semibold">CNPJ/CPF</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Telefone</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Contato</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right w-40">Valor R$</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum representante encontrado.</TableCell></TableRow>
              ) : paged.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><span className="text-primary font-medium">{r.nome_fantasia ?? r.razao_social}</span></TableCell>
                  <TableCell>{r.cnpj ?? r.cpf ?? "—"}</TableCell>
                  <TableCell>{r.telefone ?? "—"}</TableCell>
                  <TableCell>{r.contato ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      className="h-8 text-right tabular-nums"
                      value={edits[r.id] ?? ""}
                      onChange={(e) => setEdits((p) => ({ ...p, [r.id]: e.target.value }))}
                      onBlur={(e) => setEdits((p) => ({ ...p, [r.id]: fmtBRL(parseBRL(e.target.value)) }))}
                    />
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
              <Label className="text-xs text-muted-foreground">Nome/Razão:</Label>
              <Input value={filterNome} onChange={(e) => setFilterNome(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <div className="min-w-[200px]">
              <Label className="text-xs text-muted-foreground">CNPJ:</Label>
              <Input value={filterCnpj} onChange={(e) => setFilterCnpj(e.target.value)} className="h-9" maxLength={20} />
            </div>
            <Button variant="secondary" onClick={() => { setAppliedNome(filterNome); setAppliedCnpj(filterCnpj); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <RepDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => qc.invalidateQueries({ queryKey: ["rep-meta"] })}
      />
    </div>
  );
}

function RepDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void;
}) {
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [contato, setContato] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (!open) return;
    setNomeFantasia(""); setRazaoSocial(""); setDocumento("");
    setTelefone(""); setContato(""); setValor("");
  }, [open]);

  const parseBRL = (s: string): number => {
    const clean = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  };

  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  const mut = useMutation({
    mutationFn: async () => {
      if (!nomeFantasia.trim() && !razaoSocial.trim()) {
        throw new Error("Informe Nome Fantasia ou Razão Social.");
      }
      const digits = onlyDigits(documento);
      const isCnpj = digits.length === 14;
      const isCpf = digits.length === 11;
      const payload = {
        nome_fantasia: nomeFantasia.trim() || null,
        razao_social: (razaoSocial.trim() || nomeFantasia.trim()),
        cnpj: isCnpj ? documento.trim() : null,
        cpf: isCpf ? documento.trim() : null,
        telefone: telefone.trim() || null,
        contato: contato.trim() || null,
        meta_valor: parseBRL(valor),
        flag_representante: true,
        status: "ativo",
      };
      const { error } = await supabase.from("customers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Representante cadastrado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🌸 Cadastro Representante</DialogTitle>
        </DialogHeader>
        <div className="rounded bg-muted/50 p-5 space-y-3">
          <Row label="Nome Fantasia" required>
            <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} maxLength={120} />
          </Row>
          <Row label="Razão Social">
            <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} maxLength={160} />
          </Row>
          <Row label="CNPJ/CPF">
            <Input value={documento} onChange={(e) => setDocumento(e.target.value)} maxLength={20} />
          </Row>
          <Row label="Telefone">
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={30} />
          </Row>
          <Row label="Contato">
            <Input value={contato} onChange={(e) => setContato(e.target.value)} maxLength={80} />
          </Row>
          <Row label="Valor R$">
            <Input value={valor} onChange={(e) => setValor(e.target.value)} className="text-right max-w-[200px]" />
          </Row>
        </div>
        <p className="text-center text-sm text-destructive">* Campo Obrigatório</p>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            CADASTRAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
