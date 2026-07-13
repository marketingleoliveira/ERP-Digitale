import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/time-log")({
  ssr: false,
  head: () => ({ meta: [{ title: "Time Log — Auditoria" }] }),
  component: TimeLogPage,
});

interface AuditRow {
  id: string;
  entidade: string;
  entidade_id: string | null;
  acao: string;
  de_status: string | null;
  para_status: string | null;
  payload: unknown;
  user_id: string | null;
  created_at: string;
}

function TimeLogPage() {
  const [filtro, setFiltro] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const q = filtro.trim().toLowerCase();
  const rows = (data ?? []).filter((r) =>
    !q ||
    r.entidade.toLowerCase().includes(q) ||
    r.acao.toLowerCase().includes(q) ||
    (r.entidade_id ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Log"
        description="Registro cronológico de operações e mudanças de status no sistema (últimos 500 eventos)."
      />
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por entidade, ação ou ID..."
              className="pl-9"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>De → Para</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    Nenhum evento registrado.
                  </TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{r.entidade}</TableCell>
                    <TableCell><Badge variant="secondary">{r.acao}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {r.de_status || r.para_status ? (
                        <span>{r.de_status ?? "—"} → <span className="font-medium">{r.para_status ?? "—"}</span></span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.entidade_id ? r.entidade_id.slice(0, 8) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
