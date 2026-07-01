import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@digitaletextil.com.br");
  const [senha, setSenha] = useState("demo");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lado visual */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[oklch(0.22_0.06_258)] via-[oklch(0.28_0.08_258)] to-[oklch(0.34_0.11_258)] p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold leading-none">Digitale Têxtil</div>
            <div className="text-xs uppercase tracking-widest text-white/60">Sistema ERP</div>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight">
            Gestão completa da<br/>
            <span className="text-accent">indústria têxtil</span>
          </h1>
          <p className="max-w-md text-white/70">
            Comercial, produção (PCP), estoque, financeiro, logística e qualidade — em uma
            única plataforma corporativa, rápida e integrada.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {["Estamparia Digital", "Confecção", "Private Label", "Distribuição", "Facções", "PCP + Kanban"].map((t) => (
              <div key={t} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">{t}</div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/50">
          © {new Date().getFullYear()} Digitale Têxtil. Todos os direitos reservados.
        </div>

        <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-glow/30 blur-3xl" />
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardContent className="p-0">
            <div className="mb-8 lg:hidden flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Digitale Têxtil</div>
                <div className="text-xs text-muted-foreground">Sistema ERP</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse o Sistema Digitale Têxtil para gerenciar sua operação.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}
              className="mt-8 space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha">Senha</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Esqueci minha senha</a>
                </div>
                <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Entrar no sistema</Button>
              <p className="text-center text-xs text-muted-foreground">
                Ambiente de demonstração — qualquer credencial acessa o ERP.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
