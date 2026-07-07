import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/solicitacoes/$id")({ ssr: false, component: Page });

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: sc } = useQuery({
    queryKey: ["sc", id],
    queryFn: async () => {
      const { data, error } = await db("solicitacoes_compra").select("*").eq("id", id).single();
      if (error) throw error;
      return data as { id: string; numero: number; setor: string | null; prioridade: string; status: string; justificativa: string | null; necessidade_em: string | null };
    },
  });
  const { data: itens = [] } = useQuery({
    queryKey: ["sc-itens", id],
    queryFn: async () => {
      const { data, error } = await db("solicitacoes_compra_itens").select("*").eq("solicitacao_id", id);
      if (error) throw error;
      return data as { id: string; descricao: string; quantidade: number; unidade: string; observacao: string | null }[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await db("solicitacoes_compra").update({ status, aprovada_em: status === "aprovada" ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado."); qc.invalidateQueries({ queryKey: ["sc", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const gerarCotacao = useMutation({
    mutationFn: async () => {
      const { data, error } = await db("cotacoes").insert({ solicitacao_id: id, status: "aberta" }).select().single();
      if (error) throw error;
      await db("solicitacoes_compra").update({ status: "cotando" }).eq("id", id);
      return (data as { id: string }).id;
    },
    onSuccess: (cid) => { toast.success("Cotação criada."); nav({ to: "/compras/cotacoes/$id", params: { id: cid } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!sc) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">📋 Solicitação #{sc.numero}</h1>
        <div className="flex gap-2">
          {sc.status === "rascunho" && <Button size="sm" onClick={() => setStatus.mutate("aprovada")}><CheckCircle2 className="h-4 w-4 mr-1.5" />Aprovar</Button>}
          {sc.status === "aprovada" && <Button size="sm" onClick={() => gerarCotacao.mutate()}><Receipt className="h-4 w-4 mr-1.5" />Iniciar Cotação</Button>}
          {["rascunho","aprovada","cotando"].includes(sc.status) && <Button size="sm" variant="outline" onClick={() => setStatus.mutate("cancelada")}><XCircle className="h-4 w-4 mr-1.5" />Cancelar</Button>}
        </div>
      </div>
      <Card className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><div className="text-muted-foreground">Setor</div><div>{sc.setor ?? "—"}</div></div>
        <div><div className="text-muted-foreground">Prioridade</div><Badge variant="outline">{sc.prioridade}</Badge></div>
        <div><div className="text-muted-foreground">Status</div><Badge>{sc.status}</Badge></div>
        <div><div className="text-muted-foreground">Necessidade</div><div>{sc.necessidade_em ?? "—"}</div></div>
        <div className="col-span-full"><div className="text-muted-foreground">Justificativa</div><div>{sc.justificativa ?? "—"}</div></div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-primary hover:bg-primary">
            {["Descrição","Qtd","Un","Observação"].map((h) => <TableHead key={h} className="text-primary-foreground">{h}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {itens.map((i) => (
              <TableRow key={i.id}><TableCell>{i.descricao}</TableCell><TableCell>{i.quantidade}</TableCell><TableCell>{i.unidade}</TableCell><TableCell>{i.observacao ?? "—"}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
