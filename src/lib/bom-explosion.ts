import { supabase } from "@/integrations/supabase/client";

export interface ExplodeBomItem {
  article_id: string;
  component_id: string | null;
  component_ref_id: string;
  component_ref_tipo: string;
  component_descricao: string;
  unidade: string;
  quantidade_liquida: number;
  quantidade_bruta: number;
  nivel: number;
  codigo?: string | null;
  ativo?: boolean;
}

export async function explodeBom(
  articleId: string, 
  quantidade: number = 1.0, 
  maxDepth: number = 10
): Promise<ExplodeBomItem[]> {
  const { data, error } = await supabase.rpc("explode_bom", {
    p_article_id: articleId,
    p_quantidade_base: quantidade,
    p_max_depth: maxDepth,
  });

  if (error) {
    console.error("Erro ao explodir BOM:", error);
    throw error;
  }

  // Buscar detalhes extras dos artigos para exibir código e status
  const componentIds = (data as ExplodeBomItem[])
    .map(item => item.component_ref_id)
    .filter((id): id is string => !!id);

  if (componentIds.length > 0) {
    const { data: articles, error: artError } = await supabase
      .from("articles")
      .select("id, codigo, ativo")
      .in("id", componentIds);

    if (!artError && articles) {
      const artMap = new Map(articles.map(a => [a.id, a]));
      return (data as ExplodeBomItem[]).map(item => ({
        ...item,
        codigo: artMap.get(item.component_ref_id)?.codigo,
        ativo: artMap.get(item.component_ref_id)?.ativo ?? true,
      }));
    }
  }

  return data as ExplodeBomItem[];
}
