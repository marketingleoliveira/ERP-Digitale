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
    </div>
  );
}
