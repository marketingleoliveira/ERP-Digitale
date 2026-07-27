import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { focusAdapter } from "./focus.adapter";

/**
 * Função segura que consolida o estado técnico do módulo fiscal.
 * Realiza auditoria em tempo real sem mocks.
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
    
    // 2. Dados da Empresa e Ambiente
    const { data: empresa } = await supabase
      .from("empresa")
      .select("provedor_nfe, ambiente_nfe, focus_nfe_token, serie_nfe, proximo_numero_nfe, cnpj, razao_social, uf, crt")
      .limit(1)
      .maybeSingle();

    // 3. Auditoria de Funções (RPCs)
    const rpcsCriticas = [
      "simulate_sales_invoice",
      "finalize_authorized_sales_invoice",
      "reserve_stock_for_sales_order",
      "ship_sales_order"
    ];

    const { data: functionsFound } = await (supabase.rpc("read_query" as any, {
      query: `SELECT proname FROM pg_proc WHERE proname = ANY(ARRAY['${rpcsCriticas.join("','")}'])`
    } as any) as any);


    const rpcsEncontradas = (functionsFound as any[])?.map(f => f.proname) || [];
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

    // 5. Cadastros Fiscais Ativos
    const [naturezas, regras] = await Promise.all([
      supabase.from("naturezas_operacao").select("id", { count: 'exact', head: true }).eq("ativo", true),
      supabase.from("regras_tributarias").select("id", { count: 'exact', head: true }).eq("ativo", true),
    ]);

    // 6. Logs Reais
    const { data: logs } = await supabase
      .from("nfe_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // 7. Bloqueadores Reais
    const bloqueadores: string[] = [];
    if (!empresa?.focus_nfe_token) bloqueadores.push("Token Focus NFe não configurado na tabela empresa");
    if (!empresa?.cnpj) bloqueadores.push("CNPJ da empresa não configurado");
    if (!empresa?.uf) bloqueadores.push("UF da empresa não configurada");
    if (rpcsAusentes.length > 0) bloqueadores.push(`RPCs ausentes: ${rpcsAusentes.join(", ")}`);
    if (tabelasAusentes.length > 0) bloqueadores.push(`Tabelas ausentes: ${tabelasAusentes.join(", ")}`);
    if ((naturezas.count || 0) === 0) bloqueadores.push("Nenhuma Natureza de Operação ativa");
    if ((regras.count || 0) === 0) bloqueadores.push("Nenhuma Regra Tributária ativa");

    return {
      isDev: !!isDev,
      ambiente: empresa?.ambiente_nfe || "homologacao",
      tokenConfigurado: !!empresa?.focus_nfe_token,
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
        naturezasAtivas: naturezas.count || 0,
        regrasAtivas: regras.count || 0,
      },
      logs: logs || [],
      bloqueadores,
      timestamp: new Date().toISOString()
    };
  });
