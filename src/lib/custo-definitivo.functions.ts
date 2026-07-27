import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Motor de Custos Definitivos (Etapa 9)
 */

const consolidateLoteCostSchema = z.object({
  lote_id: z.string().uuid(),
});

export const consolidateLoteDefinitiveCost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => consolidateLoteCostSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1. Buscar todos os custos associados ao lote
    // - Custo de material (Genealogia -> Lote original -> Custo MP)
    // - Custos de beneficiamento externo (retornos_terceiros.custo_servico)
    // - Custos de acabamento (op_acabamentos)
    // - Custos de perdas (reprovação na qualidade)

    const [loteRes, retornosRes, acabamentosRes, inspecoesRes] = await Promise.all([
      supabase.from("lotes").select("*").eq("id", data.lote_id).single(),
      supabase.from("retorno_itens").select("*, retorno:retornos_terceiros(custo_servico)").eq("lote_resultante_id", data.lote_id),
      supabase.from("op_acabamentos").select("*").eq("lote_id", data.lote_id),
      supabase.from("inspecoes_qualidade").select("*, resultados:inspecao_resultados(*)").eq("lote_id", data.lote_id)
    ]);

    if (loteRes.error) throw loteRes.error;
    const lote = loteRes.data;

    // 2. Cálculo simplificado
    let custoTotal = 0;

    // Custo base (provisório se existir ou zero)
    custoTotal += Number(lote.custo_unitario || 0) * Number(lote.quantidade || 0);

    // Adicionar custos de terceiros
    const retornos = retornosRes.data || [];
    retornos.forEach(r => {
      // Aqui teríamos uma lógica para ratear o custo_servico se um retorno tiver vários itens
      custoTotal += Number((r.retorno as any)?.custo_servico || 0);
    });

    // Adicionar custos de acabamento (ex. custo fixo por operação ou rateio de máquina)
    // ...

    // 3. Rateio pela quantidade APROVADA
    const qtdAprovada = Number(lote.saldo_aprovado || 0);
    const custoUnitarioDefinitivo = qtdAprovada > 0 ? custoTotal / qtdAprovada : 0;

    // 4. Persistir
    const { error: updateError } = await supabase
      .from("lotes")
      .update({
        custo_definitivo: custoUnitarioDefinitivo,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.lote_id);

    if (updateError) throw updateError;

    return {
      custo_total: custoTotal,
      quantidade_aprovada: qtdAprovada,
      custo_unitario_definitivo: custoUnitarioDefinitivo
    };
  });
