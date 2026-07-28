import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Info, CircleHelp } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoAsset from "@/assets/digitale-logo-white.png.asset.json";
import { ALL_MENU_ITEMS, GROUP_ORDER, useMenuVisibility, MenuItem } from "@/lib/menu-config";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { useHelp } from "@/components/help/HelpProvider";
import { LayoutDashboard, Users, ShoppingCart, Factory, Wallet, ShieldCheck, Code2, Server, type LucideIcon } from "lucide-react";

const GROUP_ICONS: Record<string, LucideIcon> = {
  "Visão Geral": LayoutDashboard,
  "Sistema": Server,
  "Cadastros": Users,
  "Operacional": ShoppingCart,
  "Produção (PCP)": Factory,
  "Financeiro & Logística": Wallet,
  "Administração": ShieldCheck,
  "DEV": Code2,
};



export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { visibility } = useMenuVisibility();
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");
  const { openHelp } = useHelp();

  const visibleItems = ALL_MENU_ITEMS.filter((i) => visibility[i.url]);
  const standalone = visibleItems.filter((i) => !i.group);
  const groups = GROUP_ORDER
    .filter((label) => label !== "DEV" || isDev)
    .map((label) => ({ label, items: visibleItems.filter((i) => i.group === label) }))
    .filter((g) => g.items.length > 0);


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/inicio" className="flex items-center gap-2 px-2 py-3">
          <img
            src={logoAsset.url}
            alt="Digitale Têxtil"
            className={collapsed ? "h-8 w-8 object-contain" : "h-12 w-auto object-contain"}
          />
          {!collapsed && (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="ml-auto inline-flex cursor-help items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold text-accent-foreground ring-1 ring-accent/30 hover:bg-accent/25 transition-colors group/erp-label">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                    #ERP DIGITALE
                    <Info className="h-3 w-3 opacity-50 group-hover/erp-label:opacity-100 transition-opacity" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-4 text-xs leading-relaxed shadow-xl border-accent/20">
                  <div className="space-y-2">
                    <p className="font-bold text-accent-foreground flex items-center gap-2">
                      <Info className="h-3.5 w-3.5" />
                      Sobre o Sistema ERP
                    </p>
                    <p className="text-muted-foreground">
                      O ERP foi projetado para atender integralmente ao processo produtivo da Digitale Têxtil, desde a aquisição do fio até a expedição do tecido acabado. O sistema integra planejamento de produção, fichas técnicas, controle de estoque por lotes, custos industriais, compras, rastreabilidade e auditoria, além de suportar operações terceirizadas, como a tinturaria, mantendo o controle completo das remessas, retornos e custos de beneficiamento. Dessa forma, cada lote pode ser acompanhado durante todo o ciclo produtivo, proporcionando maior controle operacional, redução de perdas, rastreabilidade e informações confiáveis para a tomada de decisão.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {standalone.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {standalone.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild tooltip={item.title} isActive={active} className="py-2 h-auto">
                        <Link to={item.url} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-semibold">{item.title}</span>
                            </div>
                          </div>
                          {item.helpId && !collapsed && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openHelp(item.helpId!);
                              }}
                              className="p-1 rounded-md hover:bg-blue-500/20 text-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              title="Ajuda detalhada"
                            >
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {groups.map((g) => {
          const GroupIcon = GROUP_ICONS[g.label] ?? Users;
          const hasActive = g.items.some(
            (i) => pathname === i.url || pathname.startsWith(i.url + "/"),
          );
          return (
            <SidebarGroup key={g.label}>
              <SidebarGroupContent>
                <Collapsible defaultOpen={hasActive} className="group/collapsible">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={g.label} isActive={hasActive}>
                          <GroupIcon className="h-4 w-4" />
                          <span>{g.label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {g.items.map((item) => {
                            const active = pathname === item.url || pathname.startsWith(item.url + "/");
                            return (
                              <SidebarMenuSubItem key={item.url}>
                                <SidebarMenuSubButton asChild isActive={active} className="py-2 h-auto flex-col items-start gap-1">
                                    <Link to={item.url} className="w-full flex items-center justify-between group/item">
                                      <div className="flex items-center gap-2">
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        <div className="flex flex-col">
                                          <span className="font-semibold">{item.title}</span>
                                        </div>
                                      </div>
                                      {item.helpId && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openHelp(item.helpId!);
                                          }}
                                          className="p-1 rounded-md hover:bg-blue-500/20 text-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                          title="Ajuda detalhada"
                                        >
                                          <CircleHelp className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </Collapsible>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
