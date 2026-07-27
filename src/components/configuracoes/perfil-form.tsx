import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, KeyRound, User, Mail, Briefcase, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth, useUserRoles } from "@/hooks/use-auth";

export function PerfilForm() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  
  const [perfil, setPerfil] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
  });

  const [senhas, setSenhas] = useState({
    nova: "",
    confirmacao: "",
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profileData) {
      setPerfil({
        nome: profileData.nome || "",
        email: profileData.email || "",
        telefone: profileData.telefone || "",
        cargo: profileData.cargo || "",
      });
    }
  }, [profileData]);

  const updateProfile = useMutation({
    mutationFn: async (newData: typeof perfil) => {
      const { error } = await supabase.from("profiles").update({
        nome: newData.nome,
        telefone: newData.telefone,
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updatePassword = useMutation({
    mutationFn: async (novaSenha: string) => {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setSenhas({ nova: "", confirmacao: "" });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(perfil);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhas.nova !== senhas.confirmacao) {
      return toast.error("As senhas não coincidem.");
    }
    if (senhas.nova.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres.");
    }
    updatePassword.mutate(senhas.nova);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Minhas Informações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  className="pl-9"
                  value={perfil.nome}
                  onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  className="pl-9 bg-muted"
                  value={perfil.email}
                  disabled
                  title="O e-mail não pode ser alterado"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    className="pl-9"
                    value={perfil.telefone}
                    onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo / Função</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cargo"
                    className="pl-9 bg-muted"
                    value={roles.join(", ") || perfil.cargo || "Não atribuído"}
                    disabled
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Perfil
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Segurança / Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nova_senha">Nova Senha</Label>
              <Input
                id="nova_senha"
                type="password"
                value={senhas.nova}
                onChange={(e) => setSenhas({ ...senhas, nova: e.target.value })}
                placeholder="No mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmacao_senha">Confirmar Nova Senha</Label>
              <Input
                id="confirmacao_senha"
                type="password"
                value={senhas.confirmacao}
                onChange={(e) => setSenhas({ ...senhas, confirmacao: e.target.value })}
                placeholder="Repita a nova senha"
              />
            </div>

            <Button type="submit" variant="outline" className="w-full" disabled={updatePassword.isPending}>
              {updatePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Atualizar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
