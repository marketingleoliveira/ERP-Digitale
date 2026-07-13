/**
 * Harness E2E SEED — funções de preparação e rollback do dataset de testes.
 *
 * REGRAS:
 * - Só executa fora de produção (APP_ENV !== 'production').
 * - Só usuários com cargo `desenvolvedor` ou `gerente` podem chamar.
 * - Todos os registros criados usam prefixo SEED- ou marcador TESTE E2E.
 * - Nunca insere dados diretamente para "fazer o teste passar" — usa
 *   sempre as regras normais (upsert idempotente de configuração base).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SEED_PREFIX = "SEED-";

async function assertDevAndRole(context: {
  supabase: ReturnType<typeof requireSupabaseAuth extends never ? never : never> extends never
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : never;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & { supabase: any; userId: string }): Promise<void> {
  const env = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development").toLowerCase();
  if (env === "production") {
    throw new Error("Harness E2E SEED bloqueado em produção");
  }
  const { data: isDev } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "desenvolvedor",
  });
  const { data: isGer } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "gerente",
  });
  if (!isDev && !isGer) {
    throw new Error("Acesso restrito: cargo desenvolvedor ou gerente");
  }
}

export const seedRollback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDevAndRole(context);
    const { data, error } = await context.supabase.rpc("seed_rollback");
    if (error) throw new Error(`Rollback SEED falhou: ${error.message}`);
    return { ok: true, removed: data };
  });

/**
 * Diagnóstico do dataset SEED: informa quais entidades base já existem.
 * Não cria nada — apenas relata. A preparação real da base (empresa, cliente,
 * artigo, produto, roteiro, máquina, turno, BOM, lote MP) deve ser feita
 * pelos cadastros normais do sistema, pois envolvem escolhas de negócio.
 */
export const seedDiagnostico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDevAndRole(context);
    const { supabase } = context;
    const [cli, art, prod, lote, ped, ca] = await Promise.all([
      supabase.from("customers").select("id, razao_social, nome_fantasia").ilike("razao_social", "%SEED CLI%").maybeSingle(),
      supabase.from("articles").select("id, codigo, descricao").eq("codigo", `${SEED_PREFIX}ART-01`).maybeSingle(),
      supabase.from("products").select("id, codigo, article_id").eq("codigo", `${SEED_PREFIX}PROD-01`).maybeSingle(),
      supabase.from("lotes").select("id, numero_lote, quantidade, quantidade_disponivel").eq("numero_lote", `${SEED_PREFIX}LOTE-01`).maybeSingle(),
      supabase.from("pedidos").select("id, numero, status").eq("numero", `${SEED_PREFIX}PED-001`).maybeSingle(),
      supabase.from("cliente_artigo").select("id, preco_negociado, ativo, vigencia_inicio, vigencia_fim").ilike("descricao_comercial", "SEED %").maybeSingle(),
    ]);
    return {
      cliente: cli.data,
      artigo: art.data,
      produto: prod.data,
      lote_mp: lote.data,
      pedido: ped.data,
      cliente_artigo: ca.data,
    };
  });

/**
 * Garante regra vigente cliente_artigo para o par SEED, preço R$ 50,00.
 * Idempotente: usa upsert por (cliente, artigo, produto, variante).
 */
export const seedEnsureClienteArtigo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDevAndRole(context);
    const { supabase, userId } = context;

    const { data: cli, error: eCli } = await supabase
      .from("customers")
      .select("id")
      .ilike("razao_social", "%SEED CLI%")
      .maybeSingle();
    if (eCli || !cli) throw new Error("Cliente SEED CLI LTDA não cadastrado. Cadastre em Comercial → Clientes.");

    const { data: art } = await supabase
      .from("articles")
      .select("id")
      .eq("codigo", `${SEED_PREFIX}ART-01`)
      .maybeSingle();
    if (!art) throw new Error("Artigo SEED-ART-01 não cadastrado.");

    const { data: prod } = await supabase
      .from("products")
      .select("id")
      .eq("codigo", `${SEED_PREFIX}PROD-01`)
      .maybeSingle();

    // Verifica se já existe regra vigente para esse trio
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: existente } = await supabase
      .from("cliente_artigo")
      .select("id")
      .eq("cliente_id", cli.id)
      .eq("artigo_id", art.id)
      .eq("ativo", true)
      .lte("vigencia_inicio", hoje)
      .or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`)
      .maybeSingle();

    if (existente) return { ok: true, id: existente.id, criado: false };

    const { data: nova, error } = await supabase
      .from("cliente_artigo")
      .insert({
        cliente_id: cli.id,
        artigo_id: art.id,
        produto_id: prod?.id ?? null,
        descricao_comercial: "SEED regra E2E",
        codigo_cliente: `${SEED_PREFIX}RG-01`,
        unidade: "kg",
        preco_negociado: 50,
        quantidade_minima: 0,
        desconto_maximo_pct: 0,
        vigencia_inicio: hoje,
        ativo: true,
        created_by: userId,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(`cliente_artigo: ${error.message}`);
    return { ok: true, id: (nova as { id: string }).id, criado: true };
  });
