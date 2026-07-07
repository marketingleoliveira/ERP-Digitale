import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/estoque-fios")({
  ssr: false,
  component: EstoqueFiosPage,
});

type Row = { id: string; codigo: string | null; nome: string | null };
type LoteAgg = { item_id: string; quantidade: number; quantidade_disponivel: number; lotes: number };

async function fetchFios(): Promise<Row[]> {
  const { data, error } = await supabase.from("fios").select("id, codigo, nome").order("codigo");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}
async function fetchLotesFios(): Promise<LoteAgg[]> {
  const { data, error } = await supabase
    .from("lotes" as never)
    .select("item_id, quantidade, quantidade_disponivel")
    .eq("tipo", "fio");
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{ item_id: string; quantidade: number; quantidade_disponivel: number }>;
  const map = new Map<string, LoteAgg>();
  for (const r of rows) {
    const cur = map.get(r.item_id) ?? { item_id: r.item_id, quantidade: 0, quantidade_disponivel: 0, lotes: 0 };
    cur.quantidade += Number(r.quantidade) || 0;
    cur.quantidade_disponivel += Number(r.quantidade_disponivel) || 0;
    cur.lotes += 1;
    map.set(r.item_id, cur);
  }
  return [...map.values()];
}

function EstoqueFiosPage() {
  const { data: items = [], isLoading } = useQuery({ queryKey: ["estoque-fios"], queryFn: fetchFios });
  const { data: lotes = [] } = useQuery({ queryKey: ["estoque-fios-lotes"], queryFn: fetchLotesFios });
  const aggMap = useMemo(() => new Map(lotes.map((l) => [l.item_id, l])), [lotes]);
  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 3 });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">📦 Estoque — Fios</h1>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground font-semibold">Código</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Fio</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-center w-20">Lotes</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right w-32">Qtd. Total</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right w-32">Disponível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum fio cadastrado.</TableCell></TableRow>
            ) : items.map((r) => {
              const agg = aggMap.get(r.id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-primary font-medium">{r.codigo ?? "—"}</TableCell>
                  <TableCell>{r.nome ?? "—"}</TableCell>
                  <TableCell className="text-center">{agg?.lotes ?? 0}</TableCell>
                  <TableCell className="text-right">{fmt(agg?.quantidade ?? 0)}</TableCell>
                  <TableCell className="text-right">{fmt(agg?.quantidade_disponivel ?? 0)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">Quantidades somadas a partir dos lotes cadastrados em Estoque → Lotes.</p>
    </div>
  );
}
