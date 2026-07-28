import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const processoSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  setor_id: z.string().uuid().optional().nullable(),
  centro_trabalho_padrao_id: z.string().uuid().optional().nullable(),
  duracao_padrao_minutos: z.number().int().nonnegative().default(0),
  custo_padrao: z.number().nonnegative().default(0),
  sequencia_sugerida: z.number().int().optional().nullable(),
  ativo: z.boolean().default(true),
});

export const getProcessos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("processos_industriais" as any)
      .select(\`
        *,
        setor:setores(id, nome),
        centro_trabalho:centros_trabalho(id, nome)
      \`)
      .order("sequencia_sugerida", { ascending: true });
    if (error) throw error;
    return data as any[];
  });

export const saveProcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => processoSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("processos_industriais" as any)
      .upsert(data, { onConflict: "codigo" });
    if (error) throw error;
    return { success: true };
  });
