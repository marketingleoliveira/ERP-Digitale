import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, Briefcase, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dev/organograma")({
  ssr: false,
  component: OrganogramaPage,
});

type Cargo = {
  id: string;
  nome: string;
  descricao: string | null;
};

type Profile = {
  id: string;
  nome: string;
  email: string;
};

type UserCargo = {
  user_id: string;
  cargo_id: string;
};

const sb = supabase as any;

function OrganogramaPage() {
  const { user, loading: authLoading } = useAuth();

  const { data: cargos = [], isLoading: loadingCargos } = useQuery<Cargo[]>({
    queryKey: ["organograma-cargos"],
    queryFn: async () => {
      const { data, error } = await sb.from("cargos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery<Profile[]>({
    queryKey: ["organograma-profiles"],
    queryFn: async () => {
      const { data, error } = await sb.from("profiles").select("id, nome, email").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: userCargos = [], isLoading: loadingUserCargos } = useQuery<UserCargo[]>({
    queryKey: ["organograma-user-cargos"],
    queryFn: async () => {
      const { data, error } = await sb.from("user_cargos").select("user_id, cargo_id");
      if (error) throw error;
      return data;
    },
  });

  if (authLoading || loadingCargos || loadingProfiles || loadingUserCargos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mapear usuários para seus cargos
  const usersByCargo = new Map<string, Profile[]>();
  
  userCargos.forEach((uc) => {
    const cargo = cargos.find((c) => c.id === uc.cargo_id);
    const profile = profiles.find((p) => p.id === uc.user_id);
    
    if (cargo && profile) {
      if (!usersByCargo.has(cargo.id)) {
        usersByCargo.set(cargo.id, []);
      }
      usersByCargo.get(cargo.id)?.push(profile);
    }
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">Hierarquia e distribuição de usuários por cargo no sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cargos.map((cargo) => {
          const users = usersByCargo.get(cargo.id) || [];
          return (
            <Card key={cargo.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <CardTitle className="text-lg">{cargo.nome}</CardTitle>
                  </div>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {users.length} Colaborador{users.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                {cargo.descricao && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {cargo.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.length > 0 ? (
                    users.map((profile) => (
                      <div key={profile.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <UserCircle className="w-8 h-8 text-muted-foreground" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{profile.nome}</span>
                          <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Nenhum usuário vinculado a este cargo.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {cargos.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum cargo cadastrado no sistema.</p>
        </Card>
      )}
    </div>
  );
}
