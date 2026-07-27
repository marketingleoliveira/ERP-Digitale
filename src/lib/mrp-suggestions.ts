import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type MrpSuggestionStatus = Database['public']['Enums']['mrp_suggestion_status'];

export type MrpSuggestion = {
  id: string;
  ref_tipo: string;
  ref_id: string;
  descricao: string;
  unidade: string;
  necessidade_bruta: number;
  perda: number;
  estoque_fisico: number;
  estoque_disponivel: number;
  estoque_reservado: number;
  estoque_seguranca: number;
  quantidade_em_transito: number;
  necessidade_liquida: number;
  quantidade_sugerida: number;
  quantidade_aprovada: number;
  quantidade_convertida: number;
  custo_unitario_estimado: number | null;
  custo_total_estimado: number | null;
  origem_custo: string | null;
  fornecedor_sugerido_id: string | null;
  data_necessaria: string | null;
  data_sugerida_compra: string | null;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: MrpSuggestionStatus;
  justificativa: string | null;
  motivo_rejeicao: string | null;
  motivo_cancelamento: string | null;
  versao_calculo: number;
  responsavel_id: string | null;
  aprovador_id: string | null;
  aprovada_em: string | null;
  pedido_compra_id: string | null;
  created_at: string;
  updated_at: string;
  fornecedor?: {
    nome_fantasia: string;
  };
  mrp_suggestion_orders?: {
    order_id: string;
    order_number: number;
    quantity: number;
  }[];
};

export async function generateMrpSuggestions(
  startDate?: string,
  endDate?: string,
  persist: boolean = true
) {
  const { data, error } = await supabase.rpc('generate_purchase_suggestions', {
    p_data_inicio: startDate,
    p_data_fim: endDate,
    p_modo_persistencia: persist
  });

  if (error) throw error;
  return data;
}

export async function approveMrpSuggestion(
  suggestionId: string,
  approvedQty: number,
  justification?: string
) {
  const { data, error } = await supabase.rpc('approve_mrp_suggestion', {
    p_suggestion_id: suggestionId,
    p_quantidade_aprovada: approvedQty,
    p_justificativa: justification
  });

  if (error) throw error;
  return data;
}

export async function convertSuggestionsToOrder(
  suggestionIds: string[],
  supplierId: string,
  paymentTerms?: string,
  deliveryDate?: string
) {
  const { data, error } = await supabase.rpc('convert_mrp_suggestions_to_order', {
    p_suggestion_ids: suggestionIds,
    p_fornecedor_id: supplierId,
    p_condicao_pagamento: paymentTerms,
    p_prazo_entrega: deliveryDate,
    p_idempotency_key: crypto.randomUUID()
  } as any);

  if (error) throw error;
  return data;
}

export async function fetchMrpSuggestions(filters?: any) {
  let query = supabase
    .from('mrp_suggestions')
    .select(`
      *,
      fornecedor:fornecedor_sugerido_id(nome_fantasia),
      mrp_suggestion_orders(
        order_id:purchase_order_id,
        quantity:quantity_converted,
        pedidos_compra:purchase_order_id(numero)
      )
    `)
    .order('prioridade', { ascending: false })
    .order('data_necessaria', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform order number
  const transformed = (data as any[]).map(s => ({
    ...s,
    pedidos_relacionados: s.mrp_suggestion_orders?.map((o: any) => ({
      order_id: o.order_id,
      order_number: o.pedidos_compra?.numero,
      quantity: o.quantity
    })) || []
  }));

  return transformed as MrpSuggestion[];
}

export async function fetchSuggestionOrigins(suggestionId: string) {
  const { data, error } = await supabase
    .from('mrp_suggestion_origins')
    .select(`
      *,
      op:op_id(numero, data_prevista)
    `)
    .eq('suggestion_id', suggestionId);

  if (error) throw error;
  return data;
}

export async function fetchMaterialReservations(opId?: string) {
  let query = supabase
    .from('reservas' as any)
    .select(`
      *,
      item:products(nome, codigo),
      lote:lote_id(numero_lote, quantidade_disponivel),
      op:op_id(numero)
    ` as any);

  if (opId) {
    query = (query as any).eq('op_id', opId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}


export async function createMaterialReservation(data: {
  opId: string;
  itemId: string;
  quantity: number;
  loteId: string;
}) {
  const { data: res, error } = await supabase.rpc('reserve_material_for_op' as any, {
    p_op_id: data.opId,
    p_item_id: data.itemId,
    p_quantidade: data.quantity,
    p_lote_id: data.loteId
  });

  if (error) throw error;
  return res;
}

export async function cancelReservation(reservaId: string) {
  const { error } = await supabase.rpc('cancel_material_reservation' as any, {
    p_reserva_id: reservaId
  });

  if (error) throw error;
  return true;
}
