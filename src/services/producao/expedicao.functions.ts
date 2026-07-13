/**
 * Server functions do módulo de Expedição.
 *
 * Reutiliza op_expedicoes (estendido), pedidos, ordens_producao,
 * notas_fiscais, romaneios, romaneio_itens, entrega_eventos,
 * transportadoras, lotes, expedicao_itens_lote.
 *
 * Regras aplicadas em SQL (exp_transicionar / exp_separar_lote):
 *  - Não expedir sem NF-e autorizada (override admin via OVERRIDE_ADM:*).
 *  - Não separar mais que o saldo disponível do lote.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ExpedicaoStatus =
  | "aguardando" | "em_separacao" | "separado" | "em_conferencia"
  | "conferido" | "expedido" | "em_transito" | "entregue"
  | "ocorrencia" | "devolvido";

export const listarFilaExpedicao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("op_expedicoes")
      .select(
        "id, status, volumes, peso_bruto, peso_liquido, frete_tipo, rastreio, " +
        "data_saida, data_entrega, created_at, updated_at, " +
        "op_id, pedido_id, nota_fiscal_id, romaneio_id, transportadora_id, " +
        "pedidos(id, numero, cliente_id, valor_total), " +
        "ordens_producao(id, numero), " +
        "notas_fiscais(id, numero, serie, status_sefaz)"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const listarPedidosLiberados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, numero, cliente_id, valor_total, status, prazo_entrega")
      .in("status", ["liberado", "faturado", "producao_concluida", "aprovado"])
      .order("prazo_entrega", { ascending: true, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const getExpedicao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const exp = await supabase.from("op_expedicoes").select(
      "*, pedidos(id, numero, cliente_id, valor_total, prazo_entrega), " +
      "ordens_producao(id, numero, status), " +
      "notas_fiscais(id, numero, serie, status_sefaz, chave_acesso, valor_total), " +
      "romaneios(id, numero, status)"
    ).eq("id", data.id).single();
    if (exp.error) throw exp.error;
    const expRow = exp.data as { op_id?: string | null; pedido_id?: string | null; romaneio_id?: string | null; nota_fiscal_id?: string | null };

    const [itensLote, itensOpReal, itensPedidoReal, eventos, transportadoras] = await Promise.all([
      supabase.from("expedicao_itens_lote").select(
        "*, lotes(id, numero_lote, quantidade_disponivel), op_itens(id, descricao, quantidade_planejada)"
      ).eq("expedicao_id", data.id),
      expRow.op_id
        ? supabase.from("op_itens").select("*").eq("op_id", expRow.op_id)
        : Promise.resolve({ data: [] as never[], error: null }),
      expRow.pedido_id
        ? supabase.from("pedido_itens").select("*").eq("pedido_id", expRow.pedido_id)
        : Promise.resolve({ data: [] as never[], error: null }),
      expRow.romaneio_id || expRow.nota_fiscal_id
        ? supabase.from("entrega_eventos").select("*")
            .or([
              expRow.romaneio_id ? `romaneio_id.eq.${expRow.romaneio_id}` : "",
              expRow.nota_fiscal_id ? `nota_fiscal_id.eq.${expRow.nota_fiscal_id}` : "",
            ].filter(Boolean).join(","))
            .order("data", { ascending: false })
        : Promise.resolve({ data: [] as never[], error: null }),
      supabase.from("transportadoras").select("id, nome").order("nome").limit(200),
    ]);

    return {
      expedicao: exp.data,
      itens_lote: itensLote.data ?? [],
      op_itens: itensOpReal.data ?? [],
      pedido_itens: itensPedidoReal.data ?? [],
      eventos: eventos.data ?? [],
      transportadoras: transportadoras.data ?? [],
    };
  });

export const criarExpedicao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pedido_id?: string; op_id?: string; nota_fiscal_id?: string }) => {
    if (!d.pedido_id && !d.op_id) throw new Error("Informe pedido_id ou op_id");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("op_expedicoes")
      .insert({
        pedido_id: data.pedido_id ?? null,
        op_id: data.op_id ?? null,
        nota_fiscal_id: data.nota_fiscal_id ?? null,
        status: "aguardando",
      })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const separarLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { expedicao_id: string; op_item_id?: string; lote_id: string; quantidade: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: id, error } = await supabase.rpc("exp_separar_lote", {
      _expedicao_id: data.expedicao_id,
      _op_item_id: data.op_item_id ?? undefined,
      _lote_id: data.lote_id,
      _quantidade: data.quantidade,
    } as never);
    if (error) throw error;
    return { id };
  });

export const transicionar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { expedicao_id: string; novo_status: ExpedicaoStatus; motivo?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("exp_transicionar", {
      _expedicao_id: data.expedicao_id,
      _novo_status: data.novo_status,
      _motivo: data.motivo ?? undefined,
    });
    if (error) throw error;
    return { ok: true };
  });

export const registrarConferencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    expedicao_id: string;
    divergencias: Array<{ item: string; esperado: number; encontrado: number; observacao?: string }>;
    aprovar: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error: e1 } = await supabase
      .from("op_expedicoes")
      .update({
        divergencias: data.divergencias,
        conferente_id: context.userId,
        status: "em_conferencia",
      })
      .eq("id", data.expedicao_id);
    if (e1) throw e1;

    const target = data.aprovar ? "conferido" : "ocorrencia";
    const motivo = data.aprovar ? null : `Divergências: ${data.divergencias.length}`;
    const { error: e2 } = await supabase.rpc("exp_transicionar", {
      _expedicao_id: data.expedicao_id,
      _novo_status: target,
      _motivo: motivo ?? undefined,
    });
    if (e2) throw e2;
    return { ok: true };
  });

export const fecharRomaneio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    expedicao_id: string;
    transportadora_id: string | null;
    frete_tipo: string;
    volumes: number;
    peso_bruto: number;
    peso_liquido: number;
    rastreio?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: exp, error: eExp } = await supabase
      .from("op_expedicoes")
      .select("id, romaneio_id, nota_fiscal_id, pedido_id, op_id")
      .eq("id", data.expedicao_id)
      .single();
    if (eExp) throw eExp;

    let romaneioId = exp.romaneio_id;
    if (!romaneioId) {
      const { data: nr, error: eR } = await supabase
        .from("romaneios")
        .insert({
          transportadora_id: data.transportadora_id,
          data_emissao: new Date().toISOString().slice(0, 10),
          status: "aberto",
          peso_total: data.peso_bruto,
          volumes_total: data.volumes,
        })
        .select("id")
        .single();
      if (eR) throw eR;
      romaneioId = nr.id;

      const { error: eRI } = await supabase.from("romaneio_itens").insert({
        romaneio_id: romaneioId,
        nota_fiscal_id: exp.nota_fiscal_id,
        op_id: exp.op_id,
        pedido_id: exp.pedido_id,
        volumes: data.volumes,
        peso: data.peso_bruto,
      });
      if (eRI) throw eRI;
    }

    const { error: eU } = await supabase
      .from("op_expedicoes")
      .update({
        transportadora_id: data.transportadora_id,
        frete_tipo: data.frete_tipo,
        volumes: data.volumes,
        peso_bruto: data.peso_bruto,
        peso_liquido: data.peso_liquido,
        rastreio: data.rastreio ?? null,
        romaneio_id: romaneioId,
      })
      .eq("id", data.expedicao_id);
    if (eU) throw eU;
    return { romaneio_id: romaneioId };
  });

export const registrarOcorrencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { expedicao_id: string; tipo: string; descricao: string; local?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error: e1 } = await supabase.rpc("exp_registrar_evento", {
      _expedicao_id: data.expedicao_id,
      _evento: `ocorrencia:${data.tipo}`,
      _descricao: data.descricao,
      _local: data.local ?? undefined,
    });
    if (e1) throw e1;
    const { error: e2 } = await supabase.rpc("exp_transicionar", {
      _expedicao_id: data.expedicao_id,
      _novo_status: "ocorrencia",
      _motivo: data.descricao,
    });
    if (e2) throw e2;
    return { ok: true };
  });

export const registrarEntrega = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { expedicao_id: string; data_entrega: string; comprovante_url?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error: e1 } = await supabase
      .from("op_expedicoes")
      .update({
        data_entrega: data.data_entrega,
        comprovante_url: data.comprovante_url ?? null,
        expedidor_id: context.userId,
      })
      .eq("id", data.expedicao_id);
    if (e1) throw e1;
    const { error: e2 } = await supabase.rpc("exp_transicionar", {
      _expedicao_id: data.expedicao_id,
      _novo_status: "entregue",
      _motivo: "Entrega confirmada",
    });
    if (e2) throw e2;
    return { ok: true };
  });

export const listarLotesDisponiveis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { op_id?: string; item_id?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("lotes")
      .select("id, numero_lote, quantidade_disponivel, op_id, item_id, data_entrada")
      .gt("quantidade_disponivel", 0)
      .order("data_entrada", { ascending: true })
      .limit(200);
    if (data.op_id) q = q.eq("op_id", data.op_id);
    if (data.item_id) q = q.eq("item_id", data.item_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
