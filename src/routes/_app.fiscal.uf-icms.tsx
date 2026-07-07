import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/fiscal/uf-icms")({ ssr: false, component: UfIcmsPage });

type Row = {
  id: string;
  uf: string;
  sigla: string;
  codigo: string;
  icms_pct: number;
  icms_st_pct: number;
  icms_interno_pct: number;
  icms_interestadual_pct: number;
  fundo_pobreza_pct: number;
  ativo: boolean;
};

type Editable = Pick<Row, "icms_pct" | "icms_st_pct" | "icms_interno_pct" | "icms_interestadual_pct" | "fundo_pobreza_pct">;

async function fetchAll(): Promise<Row[]> {
  const { data, error } = await supabase
    .from("uf_aliquotas" as never)
    .select("*")
    .order("uf");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function UfIcmsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["uf_aliquotas"], queryFn: fetchAll });
  const [edits, setEdits] = useState<Record<string, Partial<Editable>>>({});

  useEffect(() => { setEdits({}); }, [data.length]);

  const save = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(edits);
      if (entries.length === 0) return 0;
      for (const [id, patch] of entries) {
        const { error } = await (supabase.from("uf_aliquotas" as never) as never as {
          update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
        }).update(patch).eq("id", id);
        if (error) throw error;
      }
      return entries.length;
    },
    onSuccess: (n) => {
      if (n) toast.success(`${n} UF(s) atualizada(s).`);
      qc.invalidateQueries({ queryKey: ["uf_aliquotas"] });
      setEdits({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setField = (id: string, field: keyof Editable, val: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: Number(val) || 0 } }));
  };
  const getVal = (r: Row, field: keyof Editable): number =>
    edits[r.id]?.[field] ?? (r[field] as number);

  const dirty = Object.keys(edits).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">🧾 Listagem UF ICMS</h1>
        <Button size="sm" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Salvar {dirty > 0 && `(${dirty})`}
        </Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">UF</TableHead>
              <TableHead className="text-primary-foreground">Sigla</TableHead>
              <TableHead className="text-primary-foreground">Código</TableHead>
              <TableHead className="text-primary-foreground text-right">ICMS %</TableHead>
              <TableHead className="text-primary-foreground text-right">ICMS ST %</TableHead>
              <TableHead className="text-primary-foreground text-right">ICMS % INTERNO</TableHead>
              <TableHead className="text-primary-foreground text-right">ICMS % INTERESTADUAL</TableHead>
              <TableHead className="text-primary-foreground text-right">FUNDO % POBREZA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma UF cadastrada.</TableCell></TableRow>
            ) : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.uf}</TableCell>
                <TableCell>{r.sigla}</TableCell>
                <TableCell>{r.codigo}</TableCell>
                {(["icms_pct","icms_st_pct","icms_interno_pct","icms_interestadual_pct","fundo_pobreza_pct"] as const).map((f) => (
                  <TableCell key={f} className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 text-right"
                      value={getVal(r, f)}
                      onChange={(e) => setField(r.id, f, e.target.value)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">Total de Registros: {data.length}</p>
    </div>
  );
}
