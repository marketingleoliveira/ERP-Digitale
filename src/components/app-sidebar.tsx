import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Truck, UserCheck, Package, Warehouse,
  ShoppingCart, Receipt, Handshake, Wallet, Factory, Scissors,
  BadgeCheck, PackageCheck, FileText, ShieldCheck, Settings,
  Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Representantes", url: "/representantes", icon: UserCheck },
      { title: "Produtos", url: "/produtos", icon: Package },
    ],
  },
  {
    label: "Operacional",
    items: [
      { title: "Estoque", url: "/estoque", icon: Warehouse },
      { title: "Compras", url: "/compras", icon: ShoppingCart },
      { title: "Vendas", url: "/vendas", icon: Receipt },
      { title: "CRM", url: "/crm", icon: Handshake },
    ],
  },
  {
    label: "Produção (PCP)",
    items: [
      { title: "Ordens de Produção", url: "/producao", icon: Factory },
      { title: "Facções", url: "/faccoes", icon: Scissors },
      { title: "Qualidade", url: "/qualidade", icon: BadgeCheck },
    ],
  },
  {
    label: "Financeiro & Logística",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Logística", url: "/logistica", icon: PackageCheck },
      { title: "Fiscal", url: "/fiscal", icon: FileText },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Usuários", url: "/usuarios", icon: ShieldCheck },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-sidebar-foreground">Digitale Têxtil</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Sistema ERP</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
