import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Função segura que consolide o estado técnico do módulo fiscal.
 * Não retorna segredos (tokens, chaves).
 */
export const getFiscalCertificationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1. Verificar permissões do usuário
    const { data: isDev } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "desenvolvedor",
    });
    
    // 2. Ambiente e Configuração básica
    const { data: empresa } = await supabase
      .from("empresa")
      .select("provedor_nfe, ambiente_nfe, focus_nfe_token, serie_nfe, proximo_numero_nfe, cnpj, razao_social, uf, crt")
      .limit(1)
      .maybeSingle();

    // 3. Auditoria de Funções (RPCs)
    // Buscamos as RPCs críticas para certificar se existem
    const rpcsCriticas = [
      "simulate_sales_invoice",
      "finalize_authorized_sales_invoice",
      "reserve_stock_for_sales_order",
      "ship_sales_order"
    ];

    const { data: functions } = await (supabase.rpc("read_query" as any, {
      query: `SELECT proname FROM pg_proc WHERE proname = ANY(ARRAY['${rpcsCriticas.join("','")}'])`
    } as any) as any);

    const rpcsEncontradas = (functions as any[])?.map(f => f.proname) || [];
    const rpcsAusentes = rpcsCriticas.filter(name => !rpcsEncontradas.includes(name));

    // 4. Auditoria de Tabelas
    const tabelasCriticas = [
      "notas_fiscais", "notas_fiscais_itens", "naturezas_operacao", 
      "regras_tributarias", "contas_receber", "pre_faturamentos", "nfe_logs"
    ];

    const { data: tablesFound } = await (supabase.rpc("read_query" as any, {
        query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY(ARRAY['${tabelasCriticas.join("','")}'])`
    } as any) as any);
    
    const tabelasEncontradas = (tablesFound as any[])?.map(t => t.table_name) || [];
    const tabelasAusentes = tabelasCriticas.filter(name => !tabelasEncontradas.includes(name));

    // 5. Cadastros Fiscais Válidos
    const [{ count: naturezasCount }, { count: regrasCount }] = await Promise.all([
      supabase.from("naturezas_operacao").select("*", { count: 'exact', head: true }).eq("ativo", true),
      supabase.from("regras_tributarias").select("*", { count: 'exact', head: true }).eq("ativo", true),
    ]);

    // 6. Últimos eventos do log fiscal
    const { data: logs } = await supabase
      .from("nfe_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    // 7. Bloqueadores Reais
    const bloqueadores: string[] = [];
    if (!empresa?.focus_nfe_token && !process.env.FOCUS_NFE_TOKEN) bloqueadores.push("Token Focus NFe não configurado");
    if (!empresa?.cnpj) bloqueadores.push("CNPJ da empresa não configurado");
    if (!empresa?.uf) bloqueadores.push("UF da empresa não configurada");
    if (rpcsAusentes.length > 0) bloqueadores.push(`RPCs ausentes: ${rpcsAusentes.join(", ")}`);
    if (tabelasAusentes.length > 0) bloqueadores.push(`Tabelas ausentes: ${tabelasAusentes.join(", ")}`);
    if ((naturezasCount || 0) === 0) bloqueadores.push("Nenhuma Natureza de Operação ativa");
    if ((regrasCount || 0) === 0) bloqueadores.push("Nenhuma Regra Tributária ativa");

    return {
      isDev: !!isDev,
      ambiente: empresa?.ambiente_nfe || "homologacao",
      tokenConfigurado: !!empresa?.focus_nfe_token || !!process.env.FOCUS_NFE_TOKEN,
      empresa: {
        razaoSocial: empresa?.razao_social,
        cnpj: empresa?.cnpj,
        uf: empresa?.uf,
        crt: empresa?.crt,
      },
      faturamento: {
          serie: empresa?.serie_nfe || 1,
          proximoNumero: empresa?.proximo_numero_nfe || 1,
      },
      auditoria: {
        rpcsEncontradas,
        rpcsAusentes,
        tabelasEncontradas,
        tabelasAusentes,
      },
      cadastros: {
        naturezasAtivas: naturezasCount || 0,
        regrasAtivas: regrasCount || 0,
      },
      logs: logs || [],
      bloqueadores,
      timestamp: new Date().toISOString()
    };
  });
