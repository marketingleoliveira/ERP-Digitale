/**
 * Gera Solicitações de Compra a partir de linhas selecionadas do MRP.
 * - Agrupa por fornecedor (opcional).
 * - Preenche descrição, quantidade, unidade, ref_id, urgência, observação, OPs origem.
 * - Detecta duplicidade contra solicitações e pedidos de compra em aberto do mesmo item.
 * - Nunca gera pedido/aprovação automática — apenas a solicitação (status "aberta").
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const linhaSchema = z.object({
  ref_tipo: z.string(),
  ref_id: z.string().uuid().nullable(),
  descricao: z.string(),
  unidade: z.string(),
  necessidade_liquida: z.number().positive(),
  fornecedor_id: z.string().uuid().nullable().optional(),
  prazo_entrega_dias: z.number().nullable().optional(),
  urgencia: z.enum(["verde", "amarelo", "vermelho"]),
  origem_op_ids: z.array(z.string().uuid()).default([]),
  origem_pedido_ids: z.array(z.string().uuid()).default([]),
  observacao_mrp: z.string().nullable().optional(),
});

const inputSchema = z.object({
  linhas: z.array(linhaSchema).min(1),
  agrupar_por_fornecedor: z.boolean().default(true),
  necessidade_em: z.string().nullable().optional(), // ISO date
});

export type SolicitacaoCriada = {
  solicitacao_id: string;
  numero: number;
  fornecedor_id: string | null;
  itens: number;
  duplicidades: { descricao: string; ref_id: string | null; ja_aberta: number }[];
};

export const criarSolicitacaoDoMrp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1) Detecção de duplicidade — descontar o que já está aberto
    const refIds = [...new Set(data.linhas.map(l => l.ref_id).filter((x): x is string => !!x))];

    const [{ data: solItensAbertos }, { data: pcItensAbertos }] = await Promise.all([
      refIds.length
        ? supabase.from("solicitacoes_compra_itens")
            .select("ref_id, quantidade, solicitacao_id, solicitacoes_compra!inner(status)")
            .in("ref_id", refIds)
            .in("solicitacoes_compra.status" as never, ["aberta", "em_cotacao", "aprovada"])
        : Promise.resolve({ data: [] as { ref_id: string; quantidade: number }[] }),
      refIds.length
        ? supabase.from("pedidos_compra_itens")
            .select("ref_id, quantidade, quantidade_recebida, pedido_id, pedidos_compra!inner(status)")
            .in("ref_id", refIds)
            .in("pedidos_compra.status" as never, ["rascunho", "enviado", "confirmado", "aprovado", "parcial"])
        : Promise.resolve({ data: [] as { ref_id: string; quantidade: number; quantidade_recebida: number }[] }),
    ]);

    const abertoMap = new Map<string, number>();
    for (const s of (solItensAbertos ?? []) as { ref_id: string; quantidade: number }[]) {
      if (!s.ref_id) continue;
      abertoMap.set(s.ref_id, (abertoMap.get(s.ref_id) ?? 0) + Number(s.quantidade || 0));
    }
    for (const p of (pcItensAbertos ?? []) as { ref_id: string; quantidade: number; quantidade_recebida: number }[]) {
      if (!p.ref_id) continue;
      const pend = Math.max(0, Number(p.quantidade || 0) - Number(p.quantidade_recebida || 0));
      abertoMap.set(p.ref_id, (abertoMap.get(p.ref_id) ?? 0) + pend);
    }

    // 2) Ajusta quantidades e reúne duplicidades
    const linhasAjustadas = data.linhas.map(l => {
      const jaAberto = l.ref_id ? (abertoMap.get(l.ref_id) ?? 0) : 0;
      const qtd = Math.max(0, Number(l.necessidade_liquida) - jaAberto);
      return { ...l, quantidade_final: qtd, ja_aberto: jaAberto };
    }).filter(l => l.quantidade_final > 0);

    if (linhasAjustadas.length === 0) {
      return {
        criadas: [] as SolicitacaoCriada[],
        aviso: "Todas as necessidades selecionadas já possuem solicitação/pedido em andamento.",
        duplicidades: data.linhas.map(l => ({
          descricao: l.descricao, ref_id: l.ref_id, ja_aberta: l.ref_id ? (abertoMap.get(l.ref_id) ?? 0) : 0,
        })).filter(d => d.ja_aberta > 0),
      };
    }

    // 3) Agrupar por fornecedor
    const grupos = new Map<string, typeof linhasAjustadas>();
    for (const l of linhasAjustadas) {
      const key = data.agrupar_por_fornecedor ? (l.fornecedor_id ?? "sem_fornecedor") : `${l.ref_id}:${Math.random()}`;
      const arr = grupos.get(key) ?? [];
      arr.push(l);
      grupos.set(key, arr);
    }

    // 4) Cria uma solicitação por grupo
    const criadas: SolicitacaoCriada[] = [];
    for (const [chave, itens] of grupos.entries()) {
      const fornecedor_id = chave === "sem_fornecedor" ? null : (itens[0].fornecedor_id ?? null);
      const urgencia_max = itens.some(i => i.urgencia === "vermelho") ? "urgente"
                        : itens.some(i => i.urgencia === "amarelo") ? "alta" : "normal";
      const prazo_min = Math.min(...itens.map(i => i.prazo_entrega_dias ?? 999));

      // próximo número (MAX+1) — sequência dedicada existe mas não é exposta ao PostgREST
      const { data: last } = await supabase
        .from("solicitacoes_compra").select("numero")
        .order("numero", { ascending: false }).limit(1).maybeSingle();
      const numero = ((last as { numero: number } | null)?.numero ?? 0) + 1;


      const origem_ops = [...new Set(itens.flatMap(i => i.origem_op_ids))];
      const origem_peds = [...new Set(itens.flatMap(i => i.origem_pedido_ids))];

      const { data: sol, error: solErr } = await supabase
        .from("solicitacoes_compra")
        .insert({
          numero,
          solicitante_id: userId,
          setor: "PCP",
          prioridade: urgencia_max,
          status: "aberta",
          necessidade_em: data.necessidade_em ?? (prazo_min < 999
            ? new Date(Date.now() + prazo_min * 86400000).toISOString().slice(0, 10)
            : null),
          justificativa: "Gerado automaticamente pelo MRP",
          observacao: JSON.stringify({
            origem: "MRP",
            fornecedor_sugerido_id: fornecedor_id,
            origem_ops, origem_pedidos: origem_peds,
            duplicidades_descontadas: itens.filter(i => i.ja_aberto > 0)
              .map(i => ({ descricao: i.descricao, ja_aberto: i.ja_aberto })),
          }),
        } as never)
        .select("id, numero")
        .single();

      if (solErr) throw new Error(`Falha ao criar solicitação: ${solErr.message}`);
      const solRow = sol as { id: string; numero: number };

      const itensPayload = itens.map(l => ({
        solicitacao_id: solRow.id,
        tipo_ref: l.ref_tipo,
        ref_id: l.ref_id,
        descricao: l.descricao,
        quantidade: l.quantidade_final,
        unidade: l.unidade,
        observacao: `Urgência ${l.urgencia}${l.observacao_mrp ? ` · ${l.observacao_mrp}` : ""}${l.ja_aberto > 0 ? ` · descontado já em aberto: ${l.ja_aberto}` : ""}`,
      }));
      const { error: itErr } = await supabase.from("solicitacoes_compra_itens").insert(itensPayload as never);
      if (itErr) throw new Error(`Falha ao inserir itens: ${itErr.message}`);

      // auditoria
      await supabase.from("compras_eventos").insert({
        entidade: "solicitacao_compra",
        entidade_id: solRow.id,
        acao: "criada_pelo_mrp",
        para_status: "aberta",
        user_id: userId,
        payload: { itens: itensPayload.length, fornecedor_id, origem_ops, origem_pedidos: origem_peds },
      } as never);

      criadas.push({
        solicitacao_id: solRow.id,
        numero: solRow.numero,
        fornecedor_id,
        itens: itensPayload.length,
        duplicidades: itens.filter(i => i.ja_aberto > 0)
          .map(i => ({ descricao: i.descricao, ref_id: i.ref_id, ja_aberta: i.ja_aberto })),
      });
    }

    return {
      criadas,
      aviso: null as string | null,
      duplicidades: linhasAjustadas.filter(l => l.ja_aberto > 0)
        .map(l => ({ descricao: l.descricao, ref_id: l.ref_id, ja_aberta: l.ja_aberto })),
    };
  });
