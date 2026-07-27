import { supabase } from "@/integrations/supabase/client";

export async function simulateProductionPosting(params: {
  opId: string;
  quantidadeBoa: number;
  consumos: { lote_id: string; quantidade: number; material_id: string }[];
}) {
  const { data, error } = await supabase.rpc('simulate_production_posting' as any, {
    p_op_id: params.opId,
    p_quantidade_boa: params.quantidadeBoa,
    p_consumos: params.consumos
  });
  if (error) throw error;
  return data;
}

export async function postProductionConsumption(params: {
  opId: string;
  quantidadeProduzida: number;
  quantidadeRefugo: number;
  consumos: { lote_id: string; quantidade: number; material_id: string; reserva_id?: string }[];
  etapa: string;
  maquinaId?: string;
  idempotencyKey?: string;
}) {
  const { data, error } = await supabase.rpc('post_production_consumption' as any, {
    p_op_id: params.opId,
    p_quantidade_produzida: params.quantidadeProduzida,
    p_quantidade_refugo: params.quantidadeRefugo,
    p_consumos: params.consumos,
    p_etapa: params.etapa,
    p_maquina_id: params.maquinaId,
    p_idempotency_key: params.idempotencyKey || crypto.randomUUID()
  });
  if (error) throw error;
  return data;
}

export async function reverseProductionPosting(apontamentoId: string, motivo: string) {
  const { error } = await supabase.rpc('reverse_production_posting' as any, {
    p_apontamento_id: apontamentoId,
    p_motivo: motivo
  });
  if (error) throw error;
  return true;
}

export async function fetchOpApontamentos(opId: string) {
  const { data, error } = await supabase
    .from('op_apontamentos' as any)
    .select('*')
    .eq('op_id', opId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
