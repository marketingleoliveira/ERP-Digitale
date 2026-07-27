import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const ShipMaterialInput = z.object({
  ordemId: z.string().uuid(),
  lotes: z.array(z.object({
    lote_id: z.string().uuid(),
    quantidade: z.number().positive()
  })),
  documentoReferencia: z.string().optional(),
  idempotencyKey: z.string().uuid().optional()
});

export const shipMaterialToExternalProcessor = createServerFn({ method: "POST" })
  .inputValidator((data) => ShipMaterialInput.parse(data))
  .handler(async ({ data }) => {
    const { data: res, error } = await supabase.rpc('ship_material_to_external_processor', {
      p_ordem_id: data.ordemId,
      p_lotes_data: data.lotes,
      p_documento_referencia: data.documentoReferencia,
      p_idempotency_key: data.idempotencyKey
    } as any);

    if (error) throw error;
    return res;
  });

export const getIndustrializationOrders = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('ordens_industrializacao')
      .select(`
        *,
        fornecedor:fornecedores(nome_fantasia, razao_social),
        op:ordens_producao(numero_op),
        artigo:articles(nome, codigo)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  });

export const getIndustrializationOrderById = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: id }) => {
    const { data, error } = await supabase
      .from('ordens_industrializacao')
      .select(`
        *,
        fornecedor:fornecedores(*),
        op:ordens_producao(*),
        artigo:articles(*),
        remessas:remessas_terceiros(
          *,
          itens:remessa_itens(
            *,
            lote:lotes(*)
          ),
          retornos:retornos_terceiros(
            *,
            itens:retorno_itens(
              *,
              lote_resultante:lotes(*)
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  });
