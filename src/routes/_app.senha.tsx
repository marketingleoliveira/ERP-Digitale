import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/senha")({
  ssr: false,
  head: () => ({ meta: [{ title: "Alterar Senha" }] }),
  component: SenhaPage,
});

function SenhaPage() {
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [loading, setLoading] = useState(false);

  const forte = nova.length >= 8 && /[A-Z]/.test(nova) && /[a-z]/.test(nova) && /\d/.test(nova);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nova !== conf) return toast.error("As senhas não coincidem.");
    if (!forte) return toast.error("A senha deve ter 8+ caracteres, com maiúscula, minúscula e número.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: nova });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso.");
    setNova(""); setConf("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Alterar Senha" description="Atualize sua senha de acesso ao sistema." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> Nova senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nova">Nova senha</Label>
              <Input id="nova" type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, com maiúscula, minúscula e número.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">Confirmar senha</Label>
              <Input id="conf" type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={loading || !nova || !conf}>
              {loading ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
