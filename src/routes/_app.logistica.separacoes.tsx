import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/logistica/separacoes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Separações" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type Row = { id: string; op_id: string | null; pedido_id: string | null; status: string; iniciada_em: string | null; finalizada_em: string | null; conferida_em: string | null };

const NEXT: Record<string, string> = {
  pendente: "em_separacao",
  em_separacao: "separada",
  separada: "conferida",
};

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["separacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("separacoes").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as Row[];
    },
  });

  const trans = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "em_separacao") patch.iniciada_em = new Date().toISOString();
      if (status === "separada") patch.finalizada_em = new Date().toISOString();
      if (status === "conferida") patch.conferida_em = new Date().toISOString();
      const { error } = await supabase.from("separacoes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status atualizado."); qc.invalidateQueries({ queryKey: ["separacoes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Separações</h1>
      <Card>
        <CardHeader><CardTitle>Filas de separação</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>OP</TableHead><TableHead>Pedido</TableHead><TableHead>Status</TableHead><TableHead>Iniciada</TableHead><TableHead>Finalizada</TableHead><TableHead>Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7}>Carregando…</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-muted-foreground text-center">Nenhuma separação. Elas surgem a partir de pedidos/OPs prontas.</TableCell></TableRow> :
                data.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.op_id?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.pedido_id?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell><Badge>{r.status}</Badge></TableCell>
                    <TableCell>{r.iniciada_em ? new Date(r.iniciada_em).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell>{r.finalizada_em ? new Date(r.finalizada_em).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      {NEXT[r.status] && (
                        <Button size="sm" onClick={() => trans.mutate({ id: r.id, status: NEXT[r.status] })}>→ {NEXT[r.status]}</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
