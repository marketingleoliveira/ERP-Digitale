/**
 * Server functions do módulo Cliente × Artigo.
 * Regras: preço por especificidade (cliente+produto+variante > cliente+produto > cliente+artigo)
 * com vigência, histórico automático e proteção contra sobreposição.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const inputSchema = z.object({
  cliente_id: z.string().uuid(),
  artigo_id: z.string().uuid(),
  produto_id: z.string().uuid().nullable().optional(),
  variante_id: z.string().uuid().nullable().optional(),
  codigo_cliente: z.string().max(60).nullable().optional(),
  descricao_comercial: z.string().max(400).nullable().optional(),
  unidade: z.string().max(10).default("kg"),
  preco_negociado: z.number().nonnegative(),
  quantidade_minima: z.number().nonnegative().default(0),
  desconto_maximo_pct: z.number().min(0).max(100).default(0),
  prazo_entrega_dias: z.number().int().nonnegative().nullable().optional(),
  condicao_pagamento: z.string().max(60).nullable().optional(),
  representante_id: z.string().uuid().nullable().optional(),
  vigencia_inicio: z.string(),
  vigencia_fim: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().max(1000).nullable().optional(),
});
export type ClienteArtigoInput = z.infer<typeof inputSchema>;

export const listarClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cliente_id?: string; artigo_id?: string; ativo?: boolean; search?: string } = {}) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("cliente_artigo").select(
      "id, cliente_id, artigo_id, produto_id, variante_id, codigo_cliente, descricao_comercial, unidade, preco_negociado, quantidade_minima, desconto_maximo_pct, vigencia_inicio, vigencia_fim, ativo, representante_id"
    ).order("created_at", { ascending: false });
    if (data.cliente_id) q = q.eq("cliente_id", data.cliente_id);
    if (data.artigo_id) q = q.eq("artigo_id", data.artigo_id);
    if (typeof data.ativo === "boolean") q = q.eq("ativo", data.ativo);
    if (data.search) q = q.or(`codigo_cliente.ilike.%${data.search}%,descricao_comercial.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as Array<Record<string, unknown>>;
    if (list.length === 0) return [];
    const clientes = [...new Set(list.map(r => r.cliente_id as string))];
    const artigos = [...new Set(list.map(r => r.artigo_id as string))];
    const [{ data: cs }, { data: as }] = await Promise.all([
      supabase.from("customers").select("id, razao_social, nome_fantasia").in("id", clientes),
      supabase.from("articles").select("id, codigo, descricao").in("id", artigos),
    ]);
    const cMap = new Map(((cs ?? []) as Array<{ id: string; razao_social: string | null; nome_fantasia: string | null }>).map(c => [c.id, c.nome_fantasia || c.razao_social || ""] as [string, string]));
    const aMap = new Map(((as ?? []) as Array<{ id: string; codigo: string | null; descricao: string | null }>).map(a => [a.id, `${a.codigo ?? ""} — ${a.descricao ?? ""}`.trim()] as [string, string]));
    return list.map(r => ({
      ...r,
      cliente_nome: cMap.get(r.cliente_id as string) ?? "-",
      artigo_desc: aMap.get(r.artigo_id as string) ?? "-",
    }));
  });

export const getClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("cliente_artigo").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Regra não encontrada");
    const { data: hist } = await supabase
      .from("cliente_artigo_historico")
      .select("*")
      .eq("cliente_artigo_id", data.id)
      .order("alterado_em", { ascending: false });
    return { regra: row, historico: hist ?? [] };
  });

export const criarClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: ClienteArtigoInput) => inputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("cliente_artigo")
      .insert({ ...data, created_by: userId } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const atualizarClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; input: Partial<ClienteArtigoInput> }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("cliente_artigo").update(data.input as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const inativarClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cliente_artigo").update({ ativo: false } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type OrigemPreco = "cliente_produto_variante" | "cliente_produto" | "cliente_artigo" | "nenhum";
export type ResolucaoPreco = {
  origem: OrigemPreco;
  regra_id: string | null;
  preco: number | null;
  desconto_maximo_pct: number | null;
  condicao_pagamento: string | null;
  prazo_entrega_dias: number | null;
};

export const resolverPrecoClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    cliente_id: string;
    produto_id?: string | null;
    variante_id?: string | null;
    artigo_id?: string | null;
    data?: string | null;
  }) => i)
  .handler(async ({ data, context }): Promise<ResolucaoPreco> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc("resolver_preco_cliente_artigo", {
      _cliente_id: data.cliente_id,
      _produto_id: data.produto_id ?? undefined,
      _variante_id: data.variante_id ?? undefined,
      _artigo_id: data.artigo_id ?? undefined,
      _data: data.data ?? new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    const r = (rows as Array<{ regra_id: string; origem: string; preco: number; desconto_maximo_pct: number; condicao_pagamento: string; prazo_entrega_dias: number }> ?? [])[0];
    if (!r) return { origem: "nenhum", regra_id: null, preco: null, desconto_maximo_pct: null, condicao_pagamento: null, prazo_entrega_dias: null };
    return {
      origem: r.origem as OrigemPreco,
      regra_id: r.regra_id,
      preco: Number(r.preco),
      desconto_maximo_pct: Number(r.desconto_maximo_pct ?? 0),
      condicao_pagamento: r.condicao_pagamento ?? null,
      prazo_entrega_dias: r.prazo_entrega_dias ?? null,
    };
  });

/** Exporta em CSV (formato simples) as regras filtradas. */
export const exportarCsvClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cliente_id?: string; ativo?: boolean } = {}) => i)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("cliente_artigo").select("*");
    if (data.cliente_id) q = q.eq("cliente_id", data.cliente_id);
    if (typeof data.ativo === "boolean") q = q.eq("ativo", data.ativo);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const header = ["cliente_id","artigo_id","produto_id","variante_id","codigo_cliente","descricao_comercial","unidade","preco_negociado","quantidade_minima","desconto_maximo_pct","vigencia_inicio","vigencia_fim","ativo"];
    const csv = [header.join(";")].concat(
      (rows ?? []).map((r: Record<string, unknown>) =>
        header.map(h => {
          const v = r[h];
          if (v == null) return "";
          const s = String(v).replace(/"/g, '""');
          return s.includes(";") || s.includes("\n") ? `"${s}"` : s;
        }).join(";"),
      ),
    ).join("\n");
    return { csv };
  });

/** Importa CSV (separador ;) — cabeçalho igual ao exportarCsv. */
export const importarCsvClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { csv: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const linhas = data.csv.trim().split(/\r?\n/);
    if (linhas.length < 2) throw new Error("CSV vazio");
    const header = linhas[0].split(";").map(s => s.trim());
    const erros: Array<{ linha: number; erro: string }> = [];
    const inserts: Record<string, unknown>[] = [];
    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i].split(";");
      const obj: Record<string, unknown> = {};
      header.forEach((h, idx) => (obj[h] = cols[idx]?.trim() ?? ""));
      // Coerções
      ["preco_negociado", "quantidade_minima", "desconto_maximo_pct"].forEach(k => {
        if (obj[k] !== "" && obj[k] != null) obj[k] = Number(String(obj[k]).replace(",", "."));
      });
      obj.ativo = String(obj.ativo).toLowerCase() !== "false";
      ["produto_id", "variante_id", "vigencia_fim", "codigo_cliente", "descricao_comercial"].forEach(k => {
        if (obj[k] === "") obj[k] = null;
      });
      const parsed = inputSchema.safeParse(obj);
      if (!parsed.success) {
        erros.push({ linha: i + 1, erro: parsed.error.issues.map(e => e.message).join("; ") });
        continue;
      }
      inserts.push({ ...parsed.data, created_by: userId });
    }
    let inseridos = 0;
    if (inserts.length > 0) {
      const { error } = await supabase.from("cliente_artigo").insert(inserts as never);
      if (error) throw new Error(error.message);
      inseridos = inserts.length;
    }
    return { inseridos, erros };
  });
