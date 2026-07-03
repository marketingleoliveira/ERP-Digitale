import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Zap, Loader2, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAsset from "@/assets/digitale-logo.png.asset.json";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { emailRedirectTo: window.location.origin, data: { nome } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#e9e9e9] flex flex-col font-sans">
      {/* Header cinza com logo + data */}
      <header className="bg-gradient-to-b from-[#4a4a4a] via-[#2f2f2f] to-[#5a5a5a] border-b border-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Digitale Têxtil" className="h-12 w-auto bg-white/95 rounded px-3 py-1" />
            <div className="hidden sm:block text-white/90">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">Sistema ERP</div>
              <div className="text-sm font-semibold">Digitale Têxtil</div>
            </div>
          </div>
          <div className="text-white text-xs sm:text-sm">
            <span className="mr-1 opacity-70">©</span>
            {dataFormatada}, {saudacao}!
          </div>
        </div>
        <div className="h-3 bg-gradient-to-b from-[#8a8a8a] to-[#6a6a6a] border-t border-white/10" />
      </header>

      {/* Barra "Acesso ao Sistema" preta com form inline */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold tracking-wide whitespace-nowrap">Acesso ao Sistema</h1>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="h-8 bg-white/10">
                <TabsTrigger value="login" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black">Criar conta</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 lg:flex lg:justify-end">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-white/80">Usuário</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-8 w-56 rounded-none bg-white text-black text-xs" />
                <label className="text-xs text-white/80">Senha</label>
                <Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
                  className="h-8 w-40 rounded-none bg-white text-black text-xs" />
                <Button type="submit" size="icon" disabled={loading}
                  className="h-8 w-8 rounded-none bg-[#4a7d3a] hover:bg-[#3d6a2f]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="flex flex-wrap items-center gap-2">
                <Input placeholder="Nome" required value={nome} onChange={(e) => setNome(e.target.value)}
                  className="h-8 w-40 rounded-none bg-white text-black text-xs" />
                <Input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-8 w-52 rounded-none bg-white text-black text-xs" />
                <Input type="password" placeholder="Senha" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)}
                  className="h-8 w-36 rounded-none bg-white text-black text-xs" />
                <Button type="submit" size="icon" disabled={loading}
                  className="h-8 w-8 rounded-none bg-[#4a7d3a] hover:bg-[#3d6a2f]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Faixa "Área Restrita (login)" */}
      <div className="bg-[#e9e9e9] border-b border-[#c9c9c9]">
        <div className="mx-auto max-w-6xl px-6 flex justify-end">
          <div className="flex items-center gap-2 bg-gradient-to-b from-[#3a3a3a] to-[#1a1a1a] text-white text-xs font-semibold px-4 py-2 shadow">
            <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            Área Restrita (login)
          </div>
        </div>
      </div>


      {/* Painel "Bem Vindo!" */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <div className="border border-[#c9c9c9] bg-white shadow-sm">
            <div className="bg-gradient-to-b from-[#e0e0e0] to-[#bdbdbd] border-b border-[#a9a9a9] px-4 py-2">
              <h2 className="text-sm font-semibold text-[#333]">Bem Vindo!</h2>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 bg-[repeating-linear-gradient(0deg,#ffffff_0px,#ffffff_2px,#f6f6f6_2px,#f6f6f6_4px)]">
              <img src={logoAsset.url} alt="Digitale Têxtil - Tecidos de Alta Tecnologia" className="h-56 w-auto" />
              <div className="text-2xl font-light tracking-[0.35em] text-[#1e2a44]">TECIDOS DE ALTA TECNOLOGIA</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-b from-[#4a4a4a] to-[#2a2a2a] text-white/80 text-xs">
        <div className="mx-auto max-w-6xl px-6 py-3">
          Digitale Têxtil © {new Date().getFullYear()} Todos os Direitos Reservados
        </div>
      </footer>
    </div>
  );
}
