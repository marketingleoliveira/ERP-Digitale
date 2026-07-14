import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, ClipboardCheck, Package, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/logistica/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Logística" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["logistica-kpis"],
    queryFn: async () => {
      const [sep, rom, ent] = await Promise.all([
        supabase.from("separacoes").select("status"),
        supabase.from("romaneios").select("status"),
        supabase.from("entrega_eventos").select("id").limit(1),
      ]);
      return { sep: sep.data ?? [], rom: rom.data ?? [], ent: ent.data?.length ?? 0 };
    },
  });

  const cards = [
    { to: "/logistica/separacoes", label: "Separações", icon: ClipboardCheck, count: data?.sep.filter(s => s.status !== "conferida").length ?? 0, hint: "abertas" },
    { to: "/logistica/romaneios", label: "Romaneios", icon: Package, count: data?.rom.filter(r => r.status === "aberto" || r.status === "fechado").length ?? 0, hint: "a expedir" },
    { to: "/logistica/entregas", label: "Rastreamento", icon: MapPin, count: data?.rom.filter(r => r.status === "em_transito").length ?? 0, hint: "em trânsito" },
    { to: "/logistica/transportadoras", label: "Transportadoras", icon: Truck, count: 0, hint: "cadastro" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Logística</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <Link key={c.to} to={c.to}>
            <Card className="hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <c.icon className="h-5 w-5 text-primary" /><CardTitle className="text-sm">{c.label}</CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{c.count}</div><div className="text-xs text-muted-foreground">{c.hint}</div></CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Fluxo Logístico</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pedido → NF → <Link to="/logistica/separacoes" className="text-primary underline">Separação</Link> → Conferência → <Link to="/logistica/romaneios" className="text-primary underline">Romaneio</Link> → Expedição → <Link to="/logistica/entregas" className="text-primary underline">Entrega</Link>
        </CardContent>
      </Card>
    </div>
  );
}
