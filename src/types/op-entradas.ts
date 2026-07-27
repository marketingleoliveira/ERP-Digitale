import { z } from "zod";

export const LoteGenealogiaSchema = z.object({
  id: z.string().uuid(),
  lote_resultante_id: z.string().uuid(),
  lote_origem_id: z.string().uuid(),
  quantidade_consumida: z.number(),
  unidade: z.string().nullable(),
  op_id: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type LoteGenealogia = z.infer<typeof LoteGenealogiaSchema>;

export const OpEntradaEstoqueSchema = z.object({
  id: z.string().uuid(),
  op_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  lote_id: z.string().uuid().nullable(),
  quantidade: z.number(),
  data_entrada: z.string(),
  user_id: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type OpEntradaEstoque = z.infer<typeof OpEntradaEstoqueSchema>;

export const LoteClassificacao = z.enum(["MATERIA-PRIMA", "PRODUTO-EM-PROCESSO", "PRODUTO-ACABADO"]);
export type LoteClassificacao = z.infer<typeof LoteClassificacao>;

export interface SimulationResult {
  op_numero: string;
  artigo: string;
  quantidade_produzida: number;
  quantidade_ja_recebida: number;
  saldo_elegivel: number;
  classificacao_sugerida: string;
  custo_unitario_provisorio: number;
  unidade: string;
  avisos: string[];
}
