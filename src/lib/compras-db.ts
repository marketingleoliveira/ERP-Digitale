import { supabase } from "@/integrations/supabase/client";

// Helper to bypass typegen (new tables not yet in generated types)
type AnyTable =
  | "fornecedores"
  | "solicitacoes_compra"
  | "solicitacoes_compra_itens"
  | "cotacoes"
  | "cotacao_fornecedores"
  | "cotacao_itens"
  | "pedidos_compra"
  | "pedidos_compra_itens"
  | "recebimentos"
  | "recebimento_itens"
  | "contas_pagar"
  | "compras_eventos";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (t: AnyTable) => (supabase as any).from(t);
