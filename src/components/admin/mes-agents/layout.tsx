import React, { useState } from "react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Cpu, 
  Settings, 
  Activity, 
  AlertCircle, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  Ban, 
  History, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  Key
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listAgents, createActivationCode, updateAgentStatus, listErrorEvents } from "@/services/mes/admin.functions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AdminMesAgentsLayout() {
  const { user } = useAuth();
  const roles = useUserRoles(user?.id);
  const isAuthorized = roles.some(r => ["desenvolvedor", "admin", "gerente"].includes(r));
  const queryClient = useQueryClient();

  // Queries
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["mes-agents"],
    queryFn: listAgents,
    enabled: isAuthorized
  });

  const { data: errorEvents, isLoading: isLoadingErrors } = useQuery({
    queryKey: ["mes-error-events"],
    queryFn: listErrorEvents,
    enabled: isAuthorized
  });

  // Mutations
  const createCodeMutation = useMutation({
    mutationFn: createActivationCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mes-agents"] });
      toast.success("Código de ativação gerado com sucesso!");
    },
    onError: (err: any) => toast.error(`Erro ao gerar código: ${err.message}`)
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateAgentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mes-agents"] });
      toast.success("Status do agente atualizado!");
    },
    onError: (err: any) => toast.error(`Erro ao atualizar status: ${err.message}`)
  });

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Você não tem permissão para gerenciar os agentes MES Digitale.
          Contate o suporte ou administrador do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-8 h-8 text-primary" /> 
            Digitale MES Agent
          </h1>
          <p className="text-muted-foreground">Administração e monitoramento de dispositivos de chão de fábrica.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Novo Agente / Código
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Gerar Código de Ativação</DialogTitle>
              <DialogDescription>
                Crie um código temporário para vincular um novo terminal industrial ao ERP.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createCodeMutation.mutate({
                data: {
                  name: formData.get("name") as string,
                  unidade: formData.get("unidade") as string,
                  authorized_machines: [] // Later can add machine selection
                }
              });
            }} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Terminal</Label>
                <Input id="name" name="name" placeholder="Ex: Tecelagem-01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade / Setor</Label>
                <Input id="unidade" name="unidade" placeholder="Ex: Unidade 01" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCodeMutation.isPending}>
                  {createCodeMutation.isPending ? <Loader2 className="animate-spin" /> : "Gerar Código"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="agentes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="agentes">Agentes Ativos</TabsTrigger>
          <TabsTrigger value="pendencias" className="relative">
            Pendências
            {errorEvents && errorEvents.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 h-4 text-[10px] animate-pulse">
                {errorEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="config">Segurança & Ajuda</TabsTrigger>
        </TabsList>

        <TabsContent value="agentes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Agentes</CardTitle>
                  <CardDescription>Terminais registrados e seu status atual de comunicação.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["mes-agents"] })}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAgents ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome / Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Última Comum.</TableHead>
                      <TableHead>Eventos Pend.</TableHead>
                      <TableHead>Código Ativação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents?.map((agent) => {
                      const lastHeartbeat = agent.mes_heartbeats?.[0];
                      const isOnline = lastHeartbeat && 
                        (new Date().getTime() - new Date(lastHeartbeat.created_at).getTime()) < 60000;

                      return (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <div className="font-medium">{agent.name || "Sem Nome"}</div>
                            <div className="text-xs text-muted-foreground">{agent.unidade}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={agent.status === 'active' ? (isOnline ? 'default' : 'secondary') : 'destructive'}>
                              {agent.status === 'active' ? (isOnline ? 'ONLINE' : 'OFFLINE') : 'BLOQUEADO'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{agent.version || lastHeartbeat?.version || 'n/a'}</TableCell>
                          <TableCell className="text-xs">
                            {lastHeartbeat?.created_at 
                              ? formatDistanceToNow(new Date(lastHeartbeat.created_at), { addSuffix: true, locale: ptBR })
                              : 'Nunca'}
                          </TableCell>
                          <TableCell>
                            <span className={(lastHeartbeat?.pending_events_count ?? 0) > 0 ? "text-amber-500 font-bold" : ""}>
                              {lastHeartbeat?.pending_events_count ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            {agent.activation_code ? (
                              <div className="flex items-center gap-2">
                                <Key className="w-3 h-3 text-muted-foreground" />
                                <span className="font-mono text-xs font-bold">{agent.activation_code}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-500 font-bold">Ativado</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => toast.info(`ID: ${agent.id}`)}>
                                <Activity className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if(confirm("Deseja alterar o status deste agente?")) {
                                    updateStatusMutation.mutate({
                                      data: {
                                        agent_id: agent.id,
                                        status: (agent.status === 'active' ? 'blocked' : 'active') as 'blocked' | 'active'
                                      }
                                    });
                                  }
                                }}
                              >
                                {agent.status === 'active' ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {agents?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-8 text-muted-foreground italic">
                          Nenhum agente registrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos com Erro</CardTitle>
              <CardDescription>Eventos enviados pelo agente que falharam no processamento transacional.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingErrors ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalhes (OP/Máq)</TableHead>
                      <TableHead>Erro Retornado</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorEvents?.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-xs">
                          {formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {event.mes_agents?.name || "Desconhecido"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col">
                            <span>OP: {typeof event.payload === 'object' && event.payload && 'op_id' in event.payload ? String(event.payload.op_id).substring(0,8) : 'n/a'}</span>
                            <span>Máq: {typeof event.payload === 'object' && event.payload && 'machine_id' in event.payload ? String(event.payload.machine_id).substring(0,8) : 'n/a'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-xs truncate">
                          {event.status || "Erro no motor transacional"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Funcionalidade de reprocessamento em breve.")}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {errorEvents?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center p-8 text-muted-foreground italic">
                          Nenhuma pendência crítica encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Segurança & RLS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>O Digitale MES Agent utiliza uma camada de segurança robusta:</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li><strong>Tokens Hashing:</strong> As credenciais do agente são hasheadas no banco.</li>
                  <li><strong>RPC Secure:</strong> O processamento é feito via Store Procedure (PostgreSQL) garantindo atomicidade.</li>
                  <li><strong>RLS Ativo:</strong> Agentes só visualizam suas próprias configurações e máquinas autorizadas.</li>
                  <li><strong>Single-use Codes:</strong> Códigos de ativação expiram em 24h e são descartados após o vínculo.</li>
                </ul>
                <div className="pt-4">
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => toast.error("Confirmação necessária.")}>
                    Revogar Todas as Credenciais (Emergência)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Ajuda Contextual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold mb-1 underline">O que é o Agente?</h4>
                  <p className="text-muted-foreground">É o software PWA que roda nos tablets/PCs das máquinas para coleta de dados em tempo real.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-1 underline">Como ativar?</h4>
                  <ol className="list-decimal pl-5 text-muted-foreground space-y-1">
                    <li>Gere um código no botão "Novo Agente".</li>
                    <li>No tablet, acesse a URL do terminal.</li>
                    <li>Insira o código gerado para vincular o dispositivo.</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-bold mb-1 underline">Eventos Rejeitados?</h4>
                  <p className="text-muted-foreground">Verifique a aba "Pendências". Geralmente ocorrem por dados inconsistentes (ex: OP encerrada que ainda está sendo apontada).</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
