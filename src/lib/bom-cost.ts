import { supabase } from "@/integrations/supabase/client";

export type BomCostItem = {
  article_id: string;
  component_ref_id: string;
  component_ref_tipo: string;
  component_descricao: string;
  codigo: string;
  unidade: string;
  nivel: number;
  quantidade_liquida: number;
  quantidade_bruta: number;
  custo_unitario: number;
  custo_liquido: number;
  custo_perda: number;
  custo_total_linha: number;
  origem_custo: string;
  data_custo: string | null;
  status_custo: 'OK' | 'SEM_CUSTO' | 'DESATUALIZADO';
  is_missing: boolean;
  is_outdated: boolean;
  path: string[];
};

export type BomCostSummary = {
  custo_total_estimado: number;
  custo_unitario: number;
  custo_das_perdas: number;
  percentual_perdas: number;
  cobertura_custos: number;
  itens_sem_custo: number;
  custos_desatualizados: number;
  material_maior_impacto: string;
  status_geral: 'COMPLETO' | 'PARCIAL' | 'SEM_CUSTOS' | 'CUSTOS_DESATUALIZADOS';
};

export async function explodeBomCost(articleId: string, quantity: number = 1): Promise<BomCostItem[]> {
  const { data, error } = await supabase.rpc('explode_bom_cost', {
    p_article_id: articleId,
    p_quantidade_base: quantity
  });

  if (error) {
    console.error('Error in explode_bom_cost:', error);
    throw error;
  }

  return (data as any[]) || [];
}

export function calculateCostSummary(items: BomCostItem[], plannedQty: number): BomCostSummary {
  if (!items || items.length === 0) {
    return {
      custo_total_estimado: 0,
      custo_unitario: 0,
      custo_das_perdas: 0,
      percentual_perdas: 0,
      cobertura_custos: 0,
      itens_sem_custo: 0,
      custos_desatualizados: 0,
      material_maior_impacto: '—',
      status_geral: 'SEM_CUSTOS'
    };
  }

  // Filter to avoid double counting semi-finished if they are already in the list
  // The RPC returns a flattened list but in 'Tree' logic we might want to aggregate leaves or just sum the direct children of the root?
  // Actually, for a consolidated view of costs, we should only sum the components that are not 'artigo' or are leaves in the BOM.
  // BUT the instruction says "Total estimated cost" which usually means the sum of all raw material costs.
  
  const rawMaterials = items.filter(it => it.component_ref_tipo !== 'artigo');
  const totalCost = items.reduce((acc, it) => acc + Number(it.custo_total_linha || 0), 0);
  const totalLoss = items.reduce((acc, it) => acc + Number(it.custo_perda || 0), 0);
  
  const missingCount = items.filter(it => it.is_missing).length;
  const outdatedCount = items.filter(it => it.is_outdated).length;
  
  const coverage = items.length > 0 ? ((items.length - missingCount) / items.length) * 100 : 0;
  
  let maxImpactItem = '—';
  let maxImpactValue = -1;
  items.forEach(it => {
    if (it.custo_total_linha > maxImpactValue) {
      maxImpactValue = it.custo_total_linha;
      maxImpactItem = it.component_descricao;
    }
  });

  let status: BomCostSummary['status_geral'] = 'COMPLETO';
  if (missingCount === items.length) status = 'SEM_CUSTOS';
  else if (missingCount > 0) status = 'PARCIAL';
  else if (outdatedCount > 0) status = 'CUSTOS_DESATUALIZADOS';

  return {
    custo_total_estimado: totalCost,
    custo_unitario: plannedQty > 0 ? totalCost / plannedQty : 0,
    custo_das_perdas: totalLoss,
    percentual_perdas: totalCost > 0 ? (totalLoss / totalCost) * 100 : 0,
    cobertura_custos: coverage,
    itens_sem_custo: missingCount,
    custos_desatualizados: outdatedCount,
    material_maior_impacto: maxImpactItem,
    status_geral: status
  };
}
