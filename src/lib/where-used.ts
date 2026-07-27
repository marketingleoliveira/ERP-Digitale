import { supabase } from "@/integrations/supabase/client";

export interface WhereUsedItem {
  searched_component_id: string;
  parent_article_id: string;
  final_article_id: string;
  article_codigo: string;
  article_nome: string;
  nivel: number;
  path_ids: string[];
  path_names: string[];
  quantidade_no_vinculo: number;
  quantidade_acumulada: number;
  perda_percentual: number;
  artigo_status: boolean;
  vinculo_status: boolean;
  uso_tipo: 'Direto' | 'Indireto';
  has_cycle: boolean;
}

export async function getWhereUsed(
  componentId: string,
  includeInactive: boolean = false,
  maxDepth: number = 10
): Promise<WhereUsedItem[]> {
  const { data, error } = await supabase.rpc("where_used_bom", {
    p_component_ref_id: componentId,
    p_max_depth: maxDepth,
    p_include_inactive: includeInactive,
  });

  if (error) {
    console.error("Erro ao consultar Where Used:", error);
    throw error;
  }

  return data as WhereUsedItem[];
}
