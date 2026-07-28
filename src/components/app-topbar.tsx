import { Bell, Search, LogOut, User, CircleHelp } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useHelp } from "@/components/help/HelpProvider";

function PageHelpContent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { getHelpForPath, openHelpForPath } = useHelp();
  const content = getHelpForPath(pathname);

  if (!content) return null;

  return (
    <div className="flex items-center gap-3 text-xs">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 gap-1.5 px-2 text-destructive hover:bg-destructive/10 font-bold animate-pulse ring-2 ring-destructive/30 ring-offset-1"
        onClick={() => openHelpForPath(pathname)}
      >
        <CircleHelp className="h-3.5 w-3.5" />
        Explicação do Menu
      </Button>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-muted-foreground font-medium truncate max-w-[600px]">
        {content.summary}: {content.description}
      </span>
    </div>
  );
}


export function AppTopbar() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();


  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const displayName = profile?.nome || user?.user_metadata?.nome || user?.email || "Usuário";
  const initials = displayName
    .split(/\s+|@/).filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("");


  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, produtos, pedidos, OPs…"
            className="pl-9 h-9 bg-muted/40"
          />
        </div>
        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma notificação no momento.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {initials || "DT"}
              </div>
              <span className="hidden text-sm md:inline max-w-[160px] truncate">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/configuracoes"><User className="mr-2 h-4 w-4" />Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center px-4 py-2 bg-muted/20 border-t border-border/40 min-h-[40px] gap-3">
        <PageHelpContent />
      </div>
    </header>
  );
}
