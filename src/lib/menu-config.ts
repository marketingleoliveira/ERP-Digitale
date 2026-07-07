import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Truck, UserCheck, Package, Warehouse,
  ShoppingCart, Receipt, Handshake, Wallet, Factory, Scissors,
  BadgeCheck, PackageCheck, FileText, ShieldCheck, Settings, Shirt,
  SlidersHorizontal,
  Building2, FlaskConical, Spool, UserSquare2, Palette, Droplet,
  Sparkles, Layers, Wrench, Syringe, Target,
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
  { title: "Empresa", url: "/empresa", icon: Building2, group: "Cadastros" },
  { title: "Composição", url: "/composicao", icon: FlaskConical, group: "Cadastros" },
  { title: "Fio", url: "/fio", icon: Spool, group: "Cadastros" },
  { title: "Artigo", url: "/artigos", icon: Shirt, group: "Cadastros" },
  { title: "Cliente Artigo", url: "/cliente-artigo", icon: UserSquare2, group: "Cadastros", defaultHidden: true },
  { title: "Tinturarias", url: "/tabela-cor", icon: Palette, group: "Cadastros" },
  { title: "Cor", url: "/cor", icon: Droplet, group: "Cadastros" },
  { title: "Estampa", url: "/estampa", icon: Sparkles, group: "Cadastros" },
  { title: "Variante", url: "/variante", icon: Layers, group: "Cadastros" },
  { title: "Produto", url: "/produtos", icon: Package, group: "Cadastros" },
  { title: "Máquina", url: "/maquina", icon: Wrench, group: "Cadastros" },
  { title: "Agulha", url: "/agulha", icon: Syringe, group: "Cadastros" },
  { title: "Rep. Meta R$", url: "/rep-meta", icon: Target, group: "Cadastros" },
  { title: "Clientes", url: "/clientes", icon: Users, group: "Cadastros" },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck, group: "Cadastros" },
  { title: "Representantes (legado)", url: "/representantes", icon: UserCheck, group: "Cadastros", defaultHidden: true },
  { title: "Fiscal", url: "/fiscal", icon: FileText, group: "Financeiro & Logística", defaultHidden: true },
  { title: "Usuários", url: "/usuarios", icon: ShieldCheck, group: "Administração", defaultHidden: true },
  { title: "Configurações", url: "/configuracoes", icon: Settings, group: "Administração", defaultHidden: true },
  { title: "Gerenciar Menus", url: "/menus", icon: SlidersHorizontal, group: "Administração", locked: true },
];

export const GROUP_ORDER = [
  
  "Cadastros",
  "Operacional",
  "Produção (PCP)",
  "Financeiro & Logística",
  "Administração",
];

const STORAGE_KEY = "digitale.menu.visibility.v8";

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
