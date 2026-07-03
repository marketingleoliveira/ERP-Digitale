import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Loader2, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAsset from "@/assets/digitale-logo.png.asset.json";
import logoWhiteAsset from "@/assets/digitale-logo-white.png.asset.json";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const saudacao = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const dataFormatada = useMemo(() => {
    const d = new Date();
    const dias = ["Domingo","Segunda-Feira","Terça-Feira","Quarta-Feira","Quinta-Feira","Sexta-Feira","Sábado"];
    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    return `${dias[d.getDay()]} dia ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Header navy com logo + data */}
      <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoWhiteAsset.url} alt="Digitale Têxtil" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-[0.25em] opacity-60">Sistema ERP</div>
              <div className="text-sm font-semibold">Digitale Têxtil</div>
            </div>
          </div>
          <div className="text-xs sm:text-sm opacity-90">
            <span className="mr-1 opacity-70">©</span>
            {dataFormatada}, {saudacao}!
          </div>
        </div>
        <div className="h-1 bg-accent" />
      </header>

      {/* Barra "Acesso ao Sistema" com form inline */}
      <section className="bg-sidebar-accent text-sidebar-foreground border-b border-sidebar-border">
        <div className="mx-auto max-w-6xl px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-sm font-semibold tracking-wide whitespace-nowrap">Acesso ao Sistema</h1>
          <form onSubmit={handleLogin} className="flex flex-wrap items-center gap-2">
            <label className="text-xs opacity-80">Usuário</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-8 w-56 rounded-none bg-white text-black text-xs border-0" />
            <label className="text-xs opacity-80">Senha</label>
            <Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
              className="h-8 w-40 rounded-none bg-white text-black text-xs border-0" />
            <Button type="submit" size="icon" disabled={loading}
              className="h-8 w-8 rounded-none bg-accent hover:bg-accent/90 text-accent-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </section>

      {/* Faixa "Área Restrita" */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-6xl px-6 flex justify-end">
          <div className="flex items-center gap-2 bg-sidebar text-sidebar-foreground text-xs font-semibold px-4 py-2 shadow">
            <Zap className="h-4 w-4 text-accent fill-accent" />
            Área Restrita (login)
          </div>
        </div>
      </div>

      {/* Painel "Bem Vindo!" */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-6">
          <div className="border border-border bg-card shadow-sm">
            <div className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border px-4 py-2">
              <h2 className="text-sm font-semibold">Bem Vindo!</h2>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 bg-background">
              <img src={logoAsset.url} alt="Digitale Têxtil - Tecidos de Alta Tecnologia" className="h-56 w-auto" />
              <div className="text-2xl font-light tracking-[0.35em] text-primary">TECIDOS DE ALTA TECNOLOGIA</div>
              <p className="text-xs text-muted-foreground max-w-md text-center">
                Novos acessos são criados exclusivamente pelo administrador do sistema.
                Solicite ao setor responsável para obter suas credenciais.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground/80 text-xs border-t border-sidebar-border">
        <div className="mx-auto max-w-6xl px-6 py-3">
          Digitale Têxtil © {new Date().getFullYear()} Todos os Direitos Reservados
        </div>
      </footer>
    </div>
  );
}
