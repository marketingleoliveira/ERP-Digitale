import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/estoque/kardex")({ ssr: false, component: Page });

type Mov = {
  id: string; tipo: string; operacao: "entrada" | "saida";
  lote_id: string | null; item_tipo: string | null; item_id: string | null;
  quantidade: number; saldo_anterior: number; saldo_posterior: number;
  op_id: string | null; nota_fiscal_id: string | null; recebimento_id: string | null;
  documento_origem: string | null; observacao: string | null;
  data: string; hora: string; created_at: string; user_id: string | null;
};

const TIPOS = ["compra","producao","venda","ajuste","inventario","transferencia","cancelamento","entrada_manual","saida_manual"];

function Page() {
  const [tipo, setTipo] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["kardex", tipo],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any).from("estoque_movimentos").select("*").order("created_at", { ascending: false }).limit(500);
      if (tipo !== "todos") q = q.eq("tipo", tipo);
      const { data, error } = await q;
      if (error) throw error;
      return data as Mov[];
    },
  });

  const filtered = data.filter((m) => {
    if (!busca) return true;
    const s = busca.toLowerCase();
    return (m.lote_id ?? "").includes(s) || (m.item_id ?? "").includes(s) ||
      (m.documento_origem ?? "").toLowerCase().includes(s) || m.tipo.includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">📒 Kardex — Livro Razão do Estoque</h1>
        <div className="text-sm text-muted-foreground">{filtered.length} movimento(s)</div>
      </div>

      <Card className="p-3 flex flex-col md:flex-row gap-3">
        <Input placeholder="Buscar por lote, item, documento…" value={busca} onChange={(e) => setBusca(e.target.value)} className="max-w-sm" />
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Data/Hora","Tipo","Op.","Lote","Item","Qtd","Sld Ant.","Sld Post.","Documento","OP","NF"].map((h) =>
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Sem movimentos.</TableCell></TableRow>
            ) : filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(m.data).toLocaleDateString("pt-BR")} <span className="text-muted-foreground">{m.hora?.slice(0, 8)}</span>
                </TableCell>
                <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                <TableCell>
                  {m.operacao === "entrada"
                    ? <ArrowDownCircle className="h-4 w-4 text-green-600" />
                    : <ArrowUpCircle className="h-4 w-4 text-red-600" />}
                </TableCell>
                <TableCell className="font-mono text-xs">{m.lote_id?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell className="text-xs">{m.item_tipo ? `${m.item_tipo}/${m.item_id?.slice(0, 8)}` : "—"}</TableCell>
                <TableCell className="text-right font-mono">{Number(m.quantidade).toFixed(3)}</TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">{Number(m.saldo_anterior).toFixed(3)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{Number(m.saldo_posterior).toFixed(3)}</TableCell>
                <TableCell className="text-xs">{m.documento_origem ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{m.op_id?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{m.nota_fiscal_id?.slice(0, 8) ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
