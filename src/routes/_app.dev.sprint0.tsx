import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/dev/sprint0")({
  ssr: false,
  component: Sprint0Page,
});

type Row = { key: string; label: string; status: "ok" | "warn" | "fail"; detail: string; link?: string };

async function loadChecklist(): Promise<Row[]> {
  const q = async (table: string, extra?: (b: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let builder: any = supabase.from(table as never).select("*", { count: "exact", head: true });
    if (extra) builder = extra(builder);
    const { count, error } = await builder;
    if (error) return -1;
    return count ?? 0;
  };

  const [emp, forn, cli, lotes, articles, bom, maq, cap, turnos, cal, mt] = await Promise.all([
    q("empresa"),
    q("fornecedores"),
    q("customers"),
    q("lotes"),
    q("articles"),
    q("article_bom"),
    q("maquinas", (b) => b.eq("habilitado", true)),
    q("maquina_capacidade"),
    q("turnos", (b) => b.eq("ativo", true)),
    q("calendario_produtivo"),
    q("maquina_turnos"),
  ]);

  const st = (ok: boolean, warn = false): Row["status"] => (ok ? "ok" : warn ? "warn" : "fail");

  return [
    { key: "empresa", label: "Empresa emitente cadastrada", status: st(emp > 0), detail: `${emp} registro(s)`, link: "/empresa" },
    { key: "focus", label: "Focus NFe configurada (ambiente + série + próximo nº)", status: emp > 0 ? "warn" : "fail", detail: "Verifique manualmente", link: "/dev/focus-nfe" },
    { key: "fornecedores", label: "Ao menos 1 fornecedor ativo", status: st(forn > 0), detail: `${forn} fornecedor(es)`, link: "/compras/fornecedores" },
    { key: "clientes", label: "Pelo menos 5 clientes com dados completos", status: st(cli >= 5, cli > 0), detail: `${cli} cliente(s)`, link: "/empresa" },
    { key: "articles", label: "Ficha técnica de artigos", status: st(articles > 0), detail: `${articles} artigo(s)`, link: "/artigos" },
    { key: "bom", label: "BOM cadastrada (composição por artigo)", status: st(bom > 0), detail: `${bom} linha(s)`, link: "/producao/bom" },
    { key: "lotes", label: "Lotes iniciais (saldo de abertura)", status: st(lotes > 0), detail: `${lotes} lote(s)`, link: "/lotes" },
    { key: "maquinas", label: "Máquinas ativas cadastradas", status: st(maq > 0), detail: `${maq} máquina(s)`, link: "/maquina" },
    { key: "capacidade", label: "Capacidade preenchida em todas as máquinas ativas", status: st(cap >= maq && maq > 0, cap > 0), detail: `${cap}/${maq} preenchidas`, link: "/pcp/capacidade" },
    { key: "turnos", label: "Turnos de produção cadastrados", status: st(turnos > 0), detail: `${turnos} turno(s) ativo(s)`, link: "/pcp/turnos" },
    { key: "maquina_turnos", label: "Máquinas vinculadas a turnos", status: st(mt > 0), detail: `${mt} vínculo(s)`, link: "/pcp/maquina-turnos" },
    { key: "calendario", label: "Calendário produtivo do período populado", status: st(cal > 0), detail: `${cal} evento(s)`, link: "/pcp/calendario" },
  ];
}

function Icon({ s }: { s: Row["status"] }) {
  if (s === "ok") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (s === "warn") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
}

function Sprint0Page() {
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["sprint0-checklist"],
    queryFn: loadChecklist,
  });

  const ok = data.filter((d) => d.status === "ok").length;
  const total = data.length;
  const pct = total ? Math.round((ok / total) * 100) : 0;
  const pronto = ok === total && total > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Sprint 0 — Checklist de Dados Mestres (PCP)"
        description="Todos os itens devem estar verdes antes de iniciar a Fase 1 do PCP (roteiros, programação, Gantt)."
        actions={<Button variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Atualizar</Button>}
      />

      <Card className={`p-6 mb-6 ${pronto ? "border-emerald-500" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Progresso da Sprint 0</div>
            <div className="text-3xl font-bold">{pct}%</div>
            <div className="text-sm text-muted-foreground mt-1">{ok} de {total} itens completos</div>
          </div>
          <Badge variant={pronto ? "default" : "secondary"} className="text-base px-4 py-2">
            {pronto ? "✅ Pronto para Fase 1" : "🔴 Pendências"}
          </Badge>
        </div>
        <div className="h-2 bg-muted rounded mt-4 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card className="divide-y">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          data.map((r) => (
            <div key={r.key} className="flex items-center gap-4 p-4">
              <Icon s={r.status} />
              <div className="flex-1">
                <div className="font-medium">{r.label}</div>
                <div className="text-sm text-muted-foreground">{r.detail}</div>
              </div>
              {r.link && (
                <Button asChild variant="ghost" size="sm">
                  <Link to={r.link}>Abrir <ExternalLink className="ml-1 h-3 w-3" /></Link>
                </Button>
              )}
            </div>
          ))
        )}
      </Card>

      <Card className="mt-6 p-4 bg-muted/30">
        <div className="text-sm">
          <div className="font-medium mb-2">Próximas fases (bloqueadas até Sprint 0 verde):</div>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Fase 1: Roteiros de produção, operações, programação por máquina, Gantt inicial, dashboard industrial</li>
            <li>Fora de escopo agora: APS, IA, previsão de demanda, IoT, otimização de gargalo</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
