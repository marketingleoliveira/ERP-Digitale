/**
 * KPIs do ERP: Produção, Fiscal, Financeiro e Industrial (leadtimes).
 * Consulta agregada a partir das tabelas fonte — sem duplicidade de dados.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardIndicadores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const count = async (table: string, filter?: (q: ReturnType<typeof supabase.from>) => unknown) => {
      let q = supabase.from(table as never).select("*", { count: "exact", head: true });
      if (filter) q = filter(q as never) as typeof q;
      const { count: c } = await q;
      return c ?? 0;
    };

    const [
      opAbertas, opProducao, opConcluidas, opQualidade,
      preFat, nfEmitidas, nfCanceladas, nfRejeitadas,
    ] = await Promise.all([
      count("ordens_producao", (q) => (q as never as { in: (c: string, v: string[]) => unknown }).in("status", ["planejada","programada"])),
      count("ordens_producao", (q) => (q as never as { eq: (c: string, v: string) => unknown }).eq("status", "em_producao")),
      count("ordens_producao", (q) => (q as never as { in: (c: string, v: string[]) => unknown }).in("status", ["faturada","expedida","encerrada"])),
      count("ordens_producao", (q) => (q as never as { eq: (c: string, v: string) => unknown }).eq("status", "aguardando_qualidade")),
      count("op_faturamento", (q) => (q as never as { eq: (c: string, v: string) => unknown }).eq("status", "pre_faturado")),
      count("notas_fiscais", (q) => (q as never as { eq: (c: string, v: string) => unknown }).eq("status_sefaz", "autorizada")),
      count("notas_fiscais", (q) => (q as never as { eq: (c: string, v: string) => unknown }).eq("status_sefaz", "cancelada")),
      count("notas_fiscais", (q) => (q as never as { eq: (c: string, v: string) => unknown }).eq("status_sefaz", "rejeitada")),
    ]);

    // Financeiro
    const { data: crRows } = await supabase
      .from("contas_receber").select("valor, valor_pago, status");
    const cr = (crRows ?? []) as { valor: number; valor_pago: number; status: string }[];
    const totalFaturado = cr.reduce((s, r) => s + Number(r.valor), 0);
    const totalRecebido = cr.reduce((s, r) => s + Number(r.valor_pago), 0);
    const pendentes = cr.filter((r) => r.status !== "pago" && r.status !== "cancelado")
      .reduce((s, r) => s + (Number(r.valor) - Number(r.valor_pago)), 0);

    // Leadtimes (via op_eventos)
    const { data: evRows } = await supabase
      .from("op_eventos")
      .select("op_id, tipo, para_status, created_at")
      .in("tipo", ["status_change","nfe_autorizada"]);
    const byOp = new Map<string, { t: string; s: string | null; created: string }[]>();
    for (const e of (evRows ?? []) as { op_id: string; tipo: string; para_status: string | null; created_at: string }[]) {
      const arr = byOp.get(e.op_id) ?? [];
      arr.push({ t: e.tipo, s: e.para_status, created: e.created_at });
      byOp.set(e.op_id, arr);
    }
    const spans: Record<string, number[]> = {
      pedido_producao: [], producao_faturamento: [], faturamento_expedicao: [], pedido_entrega: [],
    };
    for (const evs of byOp.values()) {
      const at = (pred: (e: { s: string | null; t: string }) => boolean) =>
        evs.find(pred)?.created;
      const abertura = evs[0]?.created;
      const emProd = at((e) => e.s === "em_producao");
      const faturada = at((e) => e.s === "faturada");
      const expedida = at((e) => e.s === "expedida");
      const encerrada = at((e) => e.s === "encerrada");
      const d = (a?: string, b?: string) =>
        a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 36e5 : null;
      const push = (k: keyof typeof spans, v: number | null) => { if (v && v > 0) spans[k].push(v); };
      push("pedido_producao", d(abertura, emProd));
      push("producao_faturamento", d(emProd, faturada));
      push("faturamento_expedicao", d(faturada, expedida));
      push("pedido_entrega", d(abertura, encerrada));
    }
    const avg = (arr: number[]) => arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;

    return {
      producao: { abertas: opAbertas, em_producao: opProducao, concluidas: opConcluidas, aguardando_qualidade: opQualidade },
      fiscal: { pre_faturamentos: preFat, emitidas: nfEmitidas, canceladas: nfCanceladas, rejeitadas: nfRejeitadas },
      financeiro: {
        valor_faturado: Number(totalFaturado.toFixed(2)),
        recebimentos: Number(totalRecebido.toFixed(2)),
        pendentes: Number(pendentes.toFixed(2)),
        fluxo: Number((totalRecebido - pendentes).toFixed(2)),
      },
      industrial: {
        h_pedido_producao: avg(spans.pedido_producao),
        h_producao_faturamento: avg(spans.producao_faturamento),
        h_faturamento_expedicao: avg(spans.faturamento_expedicao),
        h_pedido_entrega: avg(spans.pedido_entrega),
      },
    };
  });
