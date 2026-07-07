import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Truck, UserCheck, Package, Warehouse,
  ShoppingCart, Receipt, Handshake, Wallet, Factory, Scissors,
  BadgeCheck, PackageCheck, FileText, ShieldCheck, Settings, Shirt,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  group: string;
  /** Cannot be disabled from the UI */
  locked?: boolean;
};

/** Full catalog of available menus. Add new items here. */
export const ALL_MENU_ITEMS: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, group: "Visão Geral" },
  { title: "Clientes", url: "/clientes", icon: Users, group: "Cadastros" },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck, group: "Cadastros" },
  { title: "Representantes", url: "/representantes", icon: UserCheck, group: "Cadastros" },
  { title: "Artigos", url: "/artigos", icon: Shirt, group: "Cadastros" },
  { title: "Produtos (Insumos)", url: "/produtos", icon: Package, group: "Cadastros" },
  { title: "Estoque", url: "/estoque", icon: Warehouse, group: "Operacional" },
  { title: "Compras", url: "/compras", icon: ShoppingCart, group: "Operacional" },
  { title: "Vendas", url: "/vendas", icon: Receipt, group: "Operacional" },
  { title: "CRM", url: "/crm", icon: Handshake, group: "Operacional" },
  { title: "Ordens de Produção", url: "/producao", icon: Factory, group: "Produção (PCP)" },
  { title: "Facções", url: "/faccoes", icon: Scissors, group: "Produção (PCP)" },
  { title: "Qualidade", url: "/qualidade", icon: BadgeCheck, group: "Produção (PCP)" },
  { title: "Financeiro", url: "/financeiro", icon: Wallet, group: "Financeiro & Logística" },
  { title: "Logística", url: "/logistica", icon: PackageCheck, group: "Financeiro & Logística" },
  { title: "Fiscal", url: "/fiscal", icon: FileText, group: "Financeiro & Logística" },
  { title: "Usuários", url: "/usuarios", icon: ShieldCheck, group: "Administração" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, group: "Administração" },
  { title: "Gerenciar Menus", url: "/menus", icon: SlidersHorizontal, group: "Administração", locked: true },
];

export const GROUP_ORDER = [
  "Visão Geral",
  "Cadastros",
  "Operacional",
  "Produção (PCP)",
  "Financeiro & Logística",
  "Administração",
];

const STORAGE_KEY = "digitale.menu.visibility.v1";

/** By default: everything OFF except locked items. User rebuilds from scratch. */
function getDefaults(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const item of ALL_MENU_ITEMS) map[item.url] = Boolean(item.locked);
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
