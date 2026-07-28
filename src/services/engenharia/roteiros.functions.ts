import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getRoteirosByArtigo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.string().uuid().parse(d))
  .handler(async ({ context, input }: { context: any, input: string }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("roteiros")
      .select(\`
        *,
        operacoes:roteiro_operacoes(
          *,
          processo:processos_industriais(*),
          maquinas_comp:roteiro_operacao_maquinas(
            *,
            maquina:maquinas(*)
          )
        )
      \`)
      .eq("artigo_id", input)
      .order("versao", { ascending: false });
    if (error) throw error;
    return data;
  });
