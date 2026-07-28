import { createServerFn } from "@tanstack/react-stack";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getHomeDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    
    // Obter data atual em UTC para filtros de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [
      ops, 
      maquinas,
      contasReceber,
      pedidosAtrasados
    ] = await Promise.all([
      // OPs do dia ou em andamento
      supabase.from("ordens_producao").select("id, numero, status, prioridade"),
      // Máquinas e status
      supabase.from("maquinas").select("id, status_operacional, maquina"),
      // Contas a receber vencidas
      supabase.from("contas_receber").select("valor").eq("status", "vencido"),
      // Pedidos em atraso
      supabase.from("ordens_producao").select("id", { count: "exact", head: true }).lt("data_prevista", todayStr).not("status", "in", "(faturada,expedida,encerrada,cancelada)")
    ]);

    return {
      producao: {
        realizada_hoje: 0, // Placeholder até termos apontamentos consolidados
        planejada_hoje: 0,
        ops_andamento: ops.data?.filter(o => o.status === "em_producao").length ?? 0,
        ops_atrasadas: pedidosAtrasados.count ?? 0
      },
      maquinas: {
        operacao: maquinas.data?.filter(m => m.status_operacional === "produzindo").length ?? 0,
        paradas: maquinas.data?.filter(m => ["parada", "bloqueada"].includes(m.status_operacional)).length ?? 0,
        manutencao: maquinas.data?.filter(m => m.status_operacional === "manutencao").length ?? 0,
        total: maquinas.data?.length ?? 0
      },
      financeiro: {
        vencidos: contasReceber.data?.reduce((s, r) => s + Number(r.valor), 0) ?? 0
      }
    };
  });
