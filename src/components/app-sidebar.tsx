import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logoAsset from "@/assets/digitale-logo-white.png.asset.json";
import { ALL_MENU_ITEMS, GROUP_ORDER, useMenuVisibility } from "@/lib/menu-config";
import { LayoutDashboard, Users, ShoppingCart, Factory, Wallet, ShieldCheck, type LucideIcon } from "lucide-react";

const GROUP_ICONS: Record<string, LucideIcon> = {
  "Visão Geral": LayoutDashboard,
  "Cadastros": Users,
  "Operacional": ShoppingCart,
  "Produção (PCP)": Factory,
  "Financeiro & Logística": Wallet,
  "Administração": ShieldCheck,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { visibility } = useMenuVisibility();

  const visibleItems = ALL_MENU_ITEMS.filter((i) => visibility[i.url]);
  const standalone = visibleItems.filter((i) => !i.group);
  const groups = GROUP_ORDER
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
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold text-accent-foreground ring-1 ring-accent/30">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              #Sustentabilidade
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
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
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <Link to={item.url}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
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
