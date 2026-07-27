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
    p_prazo_entrega: deliveryDate
  });

  if (error) throw error;
  return data;
}

export async function fetchMrpSuggestions(filters?: any) {
  let query = supabase
    .from('mrp_suggestions')
    .select(`
      *,
      fornecedor:fornecedor_sugerido_id(nome_fantasia)
    `)
    .order('prioridade', { ascending: false })
    .order('data_necessaria', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as MrpSuggestion[];
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
