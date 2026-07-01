import { Bell, Moon, Search, Sun, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toggleTheme, getTheme } from "@/lib/theme";
import { notificacoes } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function AppTopbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => setTheme(getTheme()), []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const initials = (user?.user_metadata?.nome ?? user?.email ?? "DT")
    .toString().split(/\s+|@/).filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("");


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
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
      <Button
        variant="ghost" size="icon"
        onClick={() => { toggleTheme(); setTheme(getTheme()); }}
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
              {notificacoes.length}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notificacoes.map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-1 py-2">
              <div className="flex w-full items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    n.tipo === "error" ? "bg-destructive/15 text-destructive"
                    : n.tipo === "warning" ? "bg-warning/20 text-warning-foreground"
                    : n.tipo === "success" ? "bg-success/15 text-success"
                    : "bg-info/15 text-info"
                  }
                >
                  {n.tipo}
                </Badge>
                <span className="text-sm font-medium">{n.titulo}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{n.tempo}</span>
              </div>
              <span className="text-xs text-muted-foreground">{n.desc}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {initials || "DT"}
            </div>
            <span className="hidden text-sm md:inline max-w-[160px] truncate">{user?.user_metadata?.nome ?? user?.email ?? "Usuário"}</span>
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
    </header>
  );
}
