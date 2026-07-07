import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_MENU_ITEMS, GROUP_ORDER, useMenuVisibility } from "@/lib/menu-config";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/_app/menus")({
  ssr: false,
  component: MenusPage,
});

function MenusPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  const { visibility, setItem, setAll } = useMenuVisibility();

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const isDev = roles.includes("desenvolvedor");
  if (!isDev) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Apenas o cargo Desenvolvedor pode gerenciar menus.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gerenciar Menus</h1>
          <p className="text-sm text-muted-foreground">
            Ative ou desative itens para ocultá-los da barra lateral.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAll(false)}>Desativar todos</Button>
          <Button size="sm" onClick={() => setAll(true)}>Ativar todos</Button>
        </div>
      </div>

      {GROUP_ORDER.map((group) => {
        const items = ALL_MENU_ITEMS.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {items.map((item) => {
                const Icon = item.icon;
                const enabled = Boolean(visibility[item.url]);
                return (
                  <div key={item.url} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.title}</span>
                          {item.locked && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Lock className="h-3 w-3" /> Fixo
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.url}</span>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      disabled={item.locked}
                      onCheckedChange={(v) => setItem(item.url, v)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
