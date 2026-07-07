/**
 * Server functions da Ordem de Produção.
 * Todas as transições usam a função SQL op_transicionar() que valida
 * a máquina de estados e grava evento na tabela op_eventos.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OpStatus =
  | "planejada" | "programada" | "em_producao" | "parcial"
  | "aguardando_qualidade" | "reprovada" | "aprovada"
  | "pronta_estoque" | "pronta_faturamento" | "faturada"
  | "expedida" | "encerrada" | "cancelada";

export const transicionarOp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { opId: string; novoStatus: OpStatus }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: novo, error } = await supabase.rpc("op_transicionar" as never, {
      _op_id: data.opId, _novo_status: data.novoStatus,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const, status: novo as OpStatus };
  });

export const registrarApontamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    opId: string; funcionarioId?: string | null; maquinaId?: string | null;
    inicio: string; fim?: string | null;
    quantidade_produzida: number; quantidade_refugo?: number; observacao?: string | null;
  }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("op_apontamentos").insert({
      op_id: data.opId, funcionario_id: data.funcionarioId ?? null,
      maquina_id: data.maquinaId ?? null, inicio: data.inicio, fim: data.fim ?? null,
      quantidade_produzida: data.quantidade_produzida,
      quantidade_refugo: data.quantidade_refugo ?? 0,
      observacao: data.observacao ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const registrarConsumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { opId: string; loteId: string; quantidade: number; observacao?: string | null }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: lote, error: lErr } = await supabase
      .from("lotes").select("quantidade_disponivel").eq("id", data.loteId).maybeSingle();
    if (lErr) throw new Error(lErr.message);
    if (!lote) throw new Error("Lote não encontrado.");
    const disp = Number((lote as { quantidade_disponivel: number }).quantidade_disponivel ?? 0);
    if (disp < data.quantidade) throw new Error(`Lote sem saldo (disp: ${disp}).`);
    const { error: uErr } = await supabase
      .from("lotes").update({ quantidade_disponivel: disp - data.quantidade } as never).eq("id", data.loteId);
    if (uErr) throw new Error(uErr.message);
    await supabase.from("op_consumos").insert({
      op_id: data.opId, lote_id: data.loteId, quantidade: data.quantidade,
      user_id: userId, observacao: data.observacao ?? null,
    } as never);
    return { ok: true as const };
  });

export const registrarQualidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    opId: string; inspetorId?: string | null;
    resultado: "aprovado" | "reprovado" | "parcial";
    quantidade_aprovada: number; quantidade_reprovada: number; motivo?: string | null;
  }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("op_qualidade").insert({
      op_id: data.opId, inspetor_id: data.inspetorId ?? null,
      resultado: data.resultado,
      quantidade_aprovada: data.quantidade_aprovada,
      quantidade_reprovada: data.quantidade_reprovada,
      motivo: data.motivo ?? null, user_id: userId,
    } as never);
    if (error) throw new Error(error.message);
    // transição automática pelo resultado
    const novo: OpStatus =
      data.resultado === "aprovado" ? "aprovada"
      : data.resultado === "reprovado" ? "reprovada"
      : "parcial";
    await supabase.rpc("op_transicionar" as never, { _op_id: data.opId, _novo_status: novo } as never);
    return { ok: true as const };
  });

export const darEntradaEstoque = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    opId: string; product_id?: string | null; variante_id?: string | null;
    quantidade: number; numero_lote?: string | null;
  }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // cria lote
    const { data: lote, error: lErr } = await supabase.from("lotes").insert({
      tipo: "produto",
      item_id: data.variante_id ?? data.product_id,
      numero_lote: data.numero_lote ?? `OP-${data.opId.slice(0, 8)}-${Date.now()}`,
      quantidade: data.quantidade,
      quantidade_disponivel: data.quantidade,
      data_entrada: new Date().toISOString().slice(0, 10),
      habilitado: true,
      op_id: data.opId,
    } as never).select("id").single();
    if (lErr) throw new Error(lErr.message);
    const loteId = (lote as { id: string }).id;

    await supabase.from("op_entradas_estoque").insert({
      op_id: data.opId, product_id: data.product_id ?? null,
      variante_id: data.variante_id ?? null, lote_id: loteId,
      quantidade: data.quantidade, user_id: userId,
    } as never);

    await supabase.rpc("op_transicionar" as never, { _op_id: data.opId, _novo_status: "pronta_estoque" } as never);
    return { ok: true as const, lote_id: loteId };
  });
