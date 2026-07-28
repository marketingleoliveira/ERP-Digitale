import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getRoteirosByArtigo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.string().uuid().parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: roteiros, error } = await supabase
      .from("roteiros" as any)
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
      .eq("artigo_id", data)
      .order("versao", { ascending: false });
    if (error) throw error;
    return roteiros as any[];
  });
