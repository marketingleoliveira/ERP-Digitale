import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Trash2, Beaker } from "lucide-react";
import { runE2eSuite, mockAutorizarNfeE2e } from "@/services/e2e/e2e-runner.functions";
import { seedDiagnostico, seedRollback, seedEnsureClienteArtigo } from "@/services/e2e/seed.functions";

export const Route = createFileRoute("/_app/dev/e2e")({
  ssr: false,
  component: E2ePage,
  head: () => ({
    meta: [
      { title: "Suíte E2E SEED — Digitale Têxtil" },
      { name: "description", content: "Runner E2E do fluxo Cliente × Artigo → Entrega, dev-only." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function statusBadge(s: string) {
  const cfg: Record<string, { cls: string; label: string }> = {
    PASS: { cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", label: "PASS" },
    FAIL: { cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30", label: "FAIL" },
    BLOCKED: { cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", label: "BLOCKED" },
    SKIPPED: { cls: "bg-muted text-muted-foreground border-border", label: "SKIP" },
  };
  const c = cfg[s] ?? cfg.SKIPPED;
  return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
}

function E2ePage() {
  const [runOutput, setRunOutput] = useState<Awaited<ReturnType<typeof runE2eSuite>> | null>(null);
  const [mockNfId, setMockNfId] = useState("");

  const diagnostico = useServerFn(seedDiagnostico);
  const ensureCA = useServerFn(seedEnsureClienteArtigo);
  const runSuite = useServerFn(runE2eSuite);
  const rollback = useServerFn(seedRollback);
  const mockAut = useServerFn(mockAutorizarNfeE2e);

  const diag = useQuery({ queryKey: ["e2e-diag"], queryFn: () => diagnostico() });

  const mEnsure = useMutation({ mutationFn: () => ensureCA(), onSuccess: () => diag.refetch() });
  const mRun = useMutation({ mutationFn: () => runSuite(), onSuccess: (d) => setRunOutput(d) });
  const mRoll = useMutation({ mutationFn: () => rollback(), onSuccess: () => { setRunOutput(null); diag.refetch(); } });
  const mMock = useMutation({ mutationFn: () => mockAut({ data: { notaFiscalId: mockNfId } }) });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Suíte E2E SEED"
        description="Runner do fluxo Cliente × Artigo → Pedido → MRP → OP → Produção → Qualidade → Estoque → Pré-Faturamento → Financeiro → Expedição → Entrega. Dev-only."
      />

      <Card className="p-4">
        <h2 className="text-sm font-medium mb-3">Diagnóstico do dataset SEED</h2>
        {diag.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{JSON.stringify(diag.data, null, 2)}</pre>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => mEnsure.mutate()} disabled={mEnsure.isPending}>
            {mEnsure.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Garantir regra Cliente × Artigo
          </Button>
          <Button size="sm" onClick={() => mRun.mutate()} disabled={mRun.isPending}>
            {mRun.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
            Rodar suíte E2E
          </Button>
          <Button size="sm" variant="destructive" onClick={() => { if (confirm("Remover TODOS os registros SEED?")) mRoll.mutate(); }} disabled={mRoll.isPending}>
            {mRoll.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Rollback SEED
          </Button>
        </div>
        {mEnsure.error ? <p className="text-xs text-destructive mt-2">{(mEnsure.error as Error).message}</p> : null}
        {mRoll.data ? <pre className="text-xs mt-2">{JSON.stringify(mRoll.data, null, 2)}</pre> : null}
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2"><Beaker className="h-4 w-4" /> MOCK_AUTORIZACAO_E2E</h2>
        <p className="text-xs text-muted-foreground mb-2">
          Marca uma nota como <code>autorizada</code> com <code>is_teste_e2e=true</code> e <code>provedor_ref='TESTE-E2E-*'</code>.
          NÃO representa autorização SEFAZ real. Bloqueado em produção.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-2 py-1 text-xs border rounded bg-background"
            placeholder="Nota fiscal ID (UUID)"
            value={mockNfId}
            onChange={(e) => setMockNfId(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={() => mMock.mutate()} disabled={!mockNfId || mMock.isPending}>
            Aplicar MOCK
          </Button>
        </div>
        {mMock.data ? <pre className="text-xs mt-2">{JSON.stringify(mMock.data, null, 2)}</pre> : null}
        {mMock.error ? <p className="text-xs text-destructive mt-2">{(mMock.error as Error).message}</p> : null}
      </Card>

      {runOutput ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Matriz PASS / FAIL / BLOCKED</h2>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600">PASS {runOutput.resumo.pass}</span>
              <span className="text-red-600">FAIL {runOutput.resumo.fail}</span>
              <span className="text-amber-600">BLOCKED {runOutput.resumo.blocked}</span>
            </div>
          </div>
          <div className="space-y-2">
            {runOutput.resultados.map((r) => (
              <div key={r.etapa} className="border rounded p-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">#{r.etapa}</span>
                  <span className="font-medium">{r.nome}</span>
                  {statusBadge(r.status)}
                </div>
                <div className="text-muted-foreground"><strong>Função:</strong> {r.funcao}</div>
                {r.esperado !== undefined ? <div><strong>Esperado:</strong> {typeof r.esperado === "string" ? r.esperado : JSON.stringify(r.esperado)}</div> : null}
                {r.obtido !== undefined ? <div><strong>Obtido:</strong> <code className="bg-muted px-1">{JSON.stringify(r.obtido)}</code></div> : null}
                {r.ids ? <div className="text-muted-foreground"><strong>IDs:</strong> {JSON.stringify(r.ids)}</div> : null}
                {r.logs.length > 0 ? <ul className="text-muted-foreground list-disc pl-4">{r.logs.map((l, i) => <li key={i}>{l}</li>)}</ul> : null}
                {r.erro ? <p className="text-destructive">{r.erro}</p> : null}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => {
              const blob = new Blob([JSON.stringify(runOutput, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `e2e-run-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Baixar JSON</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
