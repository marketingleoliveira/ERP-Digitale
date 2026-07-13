/**
 * Server functions do módulo de Qualidade.
 *
 * Reutiliza op_qualidade, ordens_producao, op_itens, op_apontamentos,
 * op_entradas_estoque, lotes, op_reprocessos, op_eventos.
 *
 * A entrada em estoque ocorre APENAS para a quantidade aprovada
 * (garantido na função SQL `op_registrar_inspecao`).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type QualidadeStatus =
  | "aguardando" | "em_inspecao" | "aprovada"
  | "aprovada_parcial" | "reprovada" | "reprocesso";

export const listarFilaInspecao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; maquina_id?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("ordens_producao")
      .select(
        "id, numero, status, prioridade, data_prevista, maquina_id, " +
          "op_itens(product_id, descricao, quantidade_planejada, quantidade_produzida, quantidade_aprovada, quantidade_reprovada)"
      )
      .in("status", ["aguardando_qualidade", "em_producao"])
      .order("prioridade", { ascending: false })
      .order("data_prevista", { ascending: true })
      .limit(200);

    if (data.maquina_id) q = q.eq("maquina_id", data.maquina_id);
    if (data.search) q = q.ilike("numero", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw error;
    return ((rows ?? []) as unknown) as Array<{
      id: string;
      numero: number;
      status: string;
      prioridade: number | null;
      data_prevista: string | null;
      maquina_id: string | null;
      op_itens: Array<{
        product_id: string | null;
        descricao: string | null;
        quantidade_planejada: number | null;
        quantidade_produzida: number | null;
        quantidade_aprovada: number | null;
        quantidade_reprovada: number | null;
      }>;
    }>;
  });

export const getOpInspecao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { op_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [op, itens, apont, inspecoes, lotes] = await Promise.all([
      supabase.from("ordens_producao").select("*").eq("id", data.op_id).single(),
      supabase.from("op_itens").select("*").eq("op_id", data.op_id),
      supabase
        .from("op_apontamentos")
        .select("id, inicio, fim, quantidade_produzida, quantidade_refugo, motivo_refugo, observacao")
        .eq("op_id", data.op_id)
        .order("inicio", { ascending: false }),
      supabase
        .from("op_qualidade")
        .select("*")
        .eq("op_id", data.op_id)
        .order("data", { ascending: false }),
      supabase
        .from("lotes")
        .select("id, numero_lote, quantidade, quantidade_disponivel, data_entrada")
        .eq("op_id", data.op_id)
        .order("created_at", { ascending: false }),
    ]);

    if (op.error) throw op.error;
    return {
      op: op.data,
      itens: itens.data ?? [],
      apontamentos: apont.data ?? [],
      inspecoes: inspecoes.data ?? [],
      lotes: lotes.data ?? [],
    };
  });

export const registrarInspecao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      op_id: string;
      quantidade_aprovada: number;
      quantidade_reprovada: number;
      quantidade_reprocesso: number;
      defeito?: string | null;
      causa?: string | null;
      observacao?: string | null;
      evidencias?: unknown[];
    }) => d
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: id, error } = await supabase.rpc("op_registrar_inspecao", {
      _op_id: data.op_id,
      _qtd_aprovada: data.quantidade_aprovada,
      _qtd_reprovada: data.quantidade_reprovada,
      _qtd_reprocesso: data.quantidade_reprocesso,
      _defeito: data.defeito ?? undefined,
      _causa: data.causa ?? undefined,
      _observacao: data.observacao ?? undefined,
      _evidencias: (data.evidencias ?? []) as never,
    });
    if (error) throw error;
    return { inspecao_id: id as unknown as string };
  });

export const indicadoresQualidade = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dias?: number } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const dias = data.dias ?? 30;
    const desde = new Date(Date.now() - dias * 86400_000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("v_qualidade_indicadores")
      .select("*")
      .gte("data", desde)
      .limit(5000);
    if (error) throw error;

    const list = rows ?? [];
    const soma = (k: "quantidade_aprovada" | "quantidade_reprovada" | "quantidade_reprocesso") =>
      list.reduce((a, r) => a + Number((r as Record<string, unknown>)[k] ?? 0), 0);
    const aprov = soma("quantidade_aprovada");
    const reprov = soma("quantidade_reprovada");
    const repro = soma("quantidade_reprocesso");
    const total = aprov + reprov + repro;

    const agrupa = (key: "maquina_id" | "product_id" | "defeito") => {
      const map = new Map<string, number>();
      for (const r of list) {
        const k = String((r as Record<string, unknown>)[key] ?? "—");
        map.set(k, (map.get(k) ?? 0) + Number(r.quantidade_reprovada ?? 0) + Number(r.quantidade_reprocesso ?? 0));
      }
      return [...map.entries()]
        .map(([k, v]) => ({ chave: k, defeitos: v }))
        .sort((a, b) => b.defeitos - a.defeitos)
        .slice(0, 10);
    };

    return {
      periodo_dias: dias,
      total_produzido: total,
      total_aprovado: aprov,
      total_reprovado: reprov,
      total_reprocesso: repro,
      taxa_aprovacao: total > 0 ? aprov / total : 0,
      taxa_refugo: total > 0 ? reprov / total : 0,
      taxa_reprocesso: total > 0 ? repro / total : 0,
      por_maquina: agrupa("maquina_id"),
      por_artigo: agrupa("product_id"),
      por_defeito: agrupa("defeito"),
    };
  });
