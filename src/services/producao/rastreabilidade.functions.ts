/**
 * Rastreabilidade completa a partir de uma OP: pedido, itens, apontamentos,
 * qualidade, lotes (estoque), NF-e, contas a receber, expedição e eventos.
 * Base para navegação entre documentos relacionados.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRastreabilidadeOp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { opId: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const opId = data.opId;

    const [
      op, itens, apontamentos, consumos, qualidade, entradas,
      lotes, notas, expedicoes, eventos,
    ] = await Promise.all([
      supabase.from("ordens_producao").select("*").eq("id", opId).maybeSingle(),
      supabase.from("op_itens").select("*").eq("op_id", opId),
      supabase.from("op_apontamentos").select("*").eq("op_id", opId).order("inicio", { ascending: false }),
      supabase.from("op_consumos").select("*").eq("op_id", opId),
      supabase.from("op_qualidade").select("*").eq("op_id", opId).order("created_at", { ascending: false }),
      supabase.from("op_entradas_estoque").select("*").eq("op_id", opId),
      supabase.from("lotes").select("*").eq("op_id", opId),
      supabase.from("notas_fiscais").select("id, numero, serie, status, status_sefaz, valor_total, chave_acesso, data_emissao").eq("op_id", opId),
      supabase.from("op_expedicoes").select("*").eq("op_id", opId),
      supabase.from("op_eventos").select("*").eq("op_id", opId).order("created_at", { ascending: true }),
    ]);

    const nfIds = ((notas.data ?? []) as { id: string }[]).map((n) => n.id);
    const contas = nfIds.length
      ? (await supabase.from("contas_receber").select("*").in("nota_fiscal_id", nfIds)).data ?? []
      : [];

    return {
      op: op.data,
      itens: itens.data ?? [],
      apontamentos: apontamentos.data ?? [],
      consumos: consumos.data ?? [],
      qualidade: qualidade.data ?? [],
      entradas: entradas.data ?? [],
      lotes: lotes.data ?? [],
      notas: notas.data ?? [],
      contas,
      expedicoes: expedicoes.data ?? [],
      eventos: eventos.data ?? [],
    };
  });
