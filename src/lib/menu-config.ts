import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Truck, UserCheck, Package, Warehouse,
  ShoppingCart, Receipt, Handshake, Wallet, Factory, Scissors,
  BadgeCheck, PackageCheck, FileText, ShieldCheck, Settings, Shirt,
  SlidersHorizontal,
  Building2, FlaskConical, Spool, UserSquare2, Palette, Droplet,
  Sparkles, Layers, Wrench, Syringe, Target, Code2, Briefcase,
  Server, IdCard, KeyRound, Clock, Network, PlugZap,
  type LucideIcon,
} from "lucide-react";


export type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  group: string;
  /** Cannot be disabled from the UI */
  locked?: boolean;
  /** Off by default (legacy items) */
  defaultHidden?: boolean;
};

/** Full catalog of available menus. Add new items here. */
export const ALL_MENU_ITEMS: MenuItem[] = [
  { title: "Início", url: "/inicio", icon: LayoutDashboard, group: "", locked: true },
  { title: "Funcionário", url: "/funcionario", icon: IdCard, group: "Sistema" },
  { title: "Usuário", url: "/usuarios", icon: ShieldCheck, group: "Sistema" },
  { title: "Senha", url: "/senha", icon: KeyRound, group: "Sistema" },
  { title: "Time Log", url: "/time-log", icon: Clock, group: "Sistema" },
  { title: "Clientes", url: "/empresa", icon: Building2, group: "Cadastros" },
  { title: "Composição", url: "/composicao", icon: FlaskConical, group: "Cadastros", defaultHidden: true },
  { title: "Fio", url: "/fio", icon: Spool, group: "Cadastros", defaultHidden: true },
  { title: "Tecidos", url: "/artigos", icon: Shirt, group: "Cadastros" },
  { title: "Cliente Artigo", url: "/cliente-artigo", icon: UserSquare2, group: "Cadastros", defaultHidden: true },
  { title: "Fornecedores", url: "/tabela-cor", icon: Palette, group: "Cadastros" },
  { title: "Cor", url: "/cor", icon: Droplet, group: "Cadastros" },
  { title: "Estampa", url: "/estampa", icon: Sparkles, group: "Cadastros" },
  { title: "Variante", url: "/variante", icon: Layers, group: "Cadastros" },
  { title: "Produto", url: "/produtos", icon: Package, group: "Cadastros" },
  { title: "Máquina", url: "/maquina", icon: Wrench, group: "Cadastros" },
  { title: "Agulha", url: "/agulha", icon: Syringe, group: "Cadastros" },
  { title: "Correias", url: "/correia", icon: Wrench, group: "Cadastros" },
  { title: "Tecidos", url: "/estoque-tecidos", icon: Shirt, group: "Estoque" },
  { title: "Fios", url: "/estoque-fios", icon: Spool, group: "Estoque" },
  { title: "Lotes", url: "/lotes", icon: PackageCheck, group: "Estoque" },
  { title: "Kardex", url: "/estoque/kardex", icon: FileText, group: "Estoque" },
  { title: "Rep. Meta R$", url: "/rep-meta", icon: Target, group: "Cadastros" },
  { title: "Representantes (legado)", url: "/representantes", icon: UserCheck, group: "Cadastros", defaultHidden: true },
  { title: "Painel OP", url: "/producao", icon: Factory, group: "Produção (PCP)" },
  { title: "Pedidos", url: "/producao/pedidos", icon: ShoppingCart, group: "Produção (PCP)" },
  { title: "Ordens de Produção", url: "/producao/op", icon: Scissors, group: "Produção (PCP)" },
  { title: "Qualidade", url: "/producao/qualidade", icon: BadgeCheck, group: "Produção (PCP)" },
  { title: "Expedição", url: "/producao/expedicao", icon: Truck, group: "Produção (PCP)" },
  { title: "Análise Industrial (OEE)", url: "/producao/industrial", icon: Factory, group: "Produção (PCP)" },
  { title: "Planejamento (PCP)", url: "/producao/plano", icon: Scissors, group: "Produção (PCP)" },
  { title: "Ficha Técnica / BOM", url: "/producao/bom", icon: BadgeCheck, group: "Produção (PCP)" },
  { title: "Turnos", url: "/pcp/turnos", icon: Clock, group: "Produção (PCP)" },
  { title: "Calendário Produtivo", url: "/pcp/calendario", icon: Clock, group: "Produção (PCP)" },
  { title: "Máquina × Turno", url: "/pcp/maquina-turnos", icon: Network, group: "Produção (PCP)" },
  { title: "Capacidade Máquina", url: "/pcp/capacidade", icon: SlidersHorizontal, group: "Produção (PCP)" },
  { title: "Operações Produtivas", url: "/pcp/operacoes", icon: Wrench, group: "Produção (PCP)" },
  { title: "Roteiros de Produção", url: "/pcp/roteiros", icon: Network, group: "Produção (PCP)" },
  { title: "OEE Industrial", url: "/pcp/oee", icon: Factory, group: "Produção (PCP)" },
  { title: "Custos Industriais", url: "/pcp/custos", icon: Wallet, group: "Produção (PCP)" },
  { title: "MRP — Materiais", url: "/pcp/mrp", icon: Package, group: "Produção (PCP)" },
  { title: "Vínculos Produto → Artigo", url: "/pcp/vinculos-artigo", icon: Package, group: "Produção (PCP)" },
  { title: "Dashboard Industrial", url: "/dashboard/industrial", icon: LayoutDashboard, group: "" },
  { title: "Dashboard Financeiro", url: "/financeiro/dashboard", icon: LayoutDashboard, group: "Financeiro & Logística" },
  { title: "Contas a Receber", url: "/financeiro", icon: Wallet, group: "Financeiro & Logística" },
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo-caixa", icon: Wallet, group: "Financeiro & Logística" },
  { title: "Movimentos", url: "/financeiro/movimentos", icon: FileText, group: "Financeiro & Logística" },
  { title: "Centros de Custo", url: "/financeiro/centros-custo", icon: Briefcase, group: "Financeiro & Logística" },
  { title: "Contas Bancárias", url: "/financeiro/contas-bancarias", icon: Wallet, group: "Financeiro & Logística" },
  { title: "Logística", url: "/logistica", icon: Truck, group: "Financeiro & Logística" },
  { title: "Separações", url: "/logistica/separacoes", icon: BadgeCheck, group: "Financeiro & Logística" },
  { title: "Romaneios", url: "/logistica/romaneios", icon: PackageCheck, group: "Financeiro & Logística" },
  { title: "Entregas / Rastreio", url: "/logistica/entregas", icon: Truck, group: "Financeiro & Logística" },
  { title: "Transportadoras", url: "/logistica/transportadoras", icon: Truck, group: "Financeiro & Logística" },
  { title: "Rastreabilidade", url: "/rastreabilidade/pedido/00000000-0000-0000-0000-000000000000", icon: Network, group: "Financeiro & Logística" },
    { title: "Dashboard Fiscal", url: "/fiscal/dashboard", icon: LayoutDashboard, group: "Fiscal" },
    { title: "Nota Fiscal", url: "/fiscal/nota-fiscal", icon: FileText, group: "Fiscal" },
  { title: "Nota Fiscal Importação", url: "/fiscal/nota-fiscal-importacao", icon: FileText, group: "Fiscal" },
  { title: "Nota Fiscal Upload", url: "/fiscal/nota-fiscal-upload", icon: FileText, group: "Fiscal" },
  { title: "Impostos", url: "/fiscal/impostos", icon: Receipt, group: "Fiscal" },
  { title: "R. Nota Fiscal", url: "/fiscal/r-nota-fiscal", icon: FileText, group: "Fiscal" },
  { title: "CFOP", url: "/fiscal/cfop", icon: BadgeCheck, group: "Fiscal" },
  { title: "UF ICMS", url: "/fiscal/uf-icms", icon: BadgeCheck, group: "Fiscal" },
  { title: "NCM", url: "/fiscal/ncm", icon: BadgeCheck, group: "Fiscal" },
  { title: "Regras Tributárias", url: "/fiscal/regras-tributarias", icon: Receipt, group: "Fiscal" },
  { title: "Benefícios Fiscais", url: "/fiscal/beneficios", icon: Receipt, group: "Fiscal" },
  { title: "Simulador Fiscal", url: "/fiscal/simulador", icon: FlaskConical, group: "Fiscal" },
  { title: "Gerenciar Menus", url: "/menus", icon: SlidersHorizontal, group: "Administração", locked: true },
  { title: "Certificados A1", url: "/fiscal/certificados", icon: ShieldCheck, group: "Fiscal" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, group: "DEV" },
  { title: "Focus NFe", url: "/dev/focus-nfe", icon: PlugZap, group: "DEV", locked: true },
  { title: "Sprint 0 Checklist", url: "/dev/sprint0", icon: BadgeCheck, group: "DEV", locked: true },
  { title: "Cargos", url: "/dev/cargos", icon: Briefcase, group: "DEV", locked: true },
  // Compras
  { title: "Dashboard Compras", url: "/compras", icon: LayoutDashboard, group: "Compras" },
  { title: "Fornecedores (Compras)", url: "/compras/fornecedores", icon: Handshake, group: "Compras" },
  { title: "Solicitações", url: "/compras/solicitacoes", icon: FileText, group: "Compras" },
  { title: "Cotações", url: "/compras/cotacoes", icon: Receipt, group: "Compras" },
  { title: "Pedidos de Compra", url: "/compras/pedidos", icon: ShoppingCart, group: "Compras" },
  { title: "Recebimentos", url: "/compras/recebimentos", icon: PackageCheck, group: "Compras" },
  { title: "Contas a Pagar", url: "/compras/contas-pagar", icon: Wallet, group: "Compras" },
];

export const GROUP_ORDER = [
  "Sistema",
  "Cadastros",
  "Estoque",
  "Operacional",
  "Compras",
  "Produção (PCP)",
  "Fiscal",
  "Financeiro & Logística",
  "Administração",
  "DEV",
];



const STORAGE_KEY = "digitale.menu.visibility.v10";

/** New/current items default visible; legacy items marked defaultHidden stay off. */
function getDefaults(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const item of ALL_MENU_ITEMS) map[item.url] = !item.defaultHidden;
  return map;
}

function readStorage(): Record<string, boolean> {
  if (typeof window === "undefined") return getDefaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const defaults = getDefaults();
    return { ...defaults, ...parsed, ...Object.fromEntries(ALL_MENU_ITEMS.filter(i => i.locked).map(i => [i.url, true])) };
  } catch {
    return getDefaults();
  }
}

const EVENT = "digitale:menu-visibility-change";

export function useMenuVisibility() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => readStorage());

  useEffect(() => {
    const handler = () => setVisibility(readStorage());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setItem = (url: string, enabled: boolean) => {
    const next = { ...readStorage(), [url]: enabled };
    for (const it of ALL_MENU_ITEMS) if (it.locked) next[it.url] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
    setVisibility(next);
  };

  const setAll = (enabled: boolean) => {
    const next: Record<string, boolean> = {};
    for (const it of ALL_MENU_ITEMS) next[it.url] = it.locked ? true : enabled;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
    setVisibility(next);
  };

  return { visibility, setItem, setAll };
}
