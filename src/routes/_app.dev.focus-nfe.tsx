import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getFocusConfigServer,
  saveFocusConfig,
  clearFocusToken,
  testFocusConnection,
} from "@/lib/focus-config.functions";
import { getFiscalCertificationStatus } from "@/services/fiscal/auditoria.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Save, PlugZap, Trash2, ShieldAlert, ExternalLink, 
  Database, ShieldCheck, Activity, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_app/dev/focus-nfe")({
  ssr: false,
  component: FocusNfeConfigPage,
});

function FocusNfeConfigPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");

  const qc = useQueryClient();
  const loadConfig = useServerFn(getFocusConfigServer);
  const loadStatus = useServerFn(getFiscalCertificationStatus);
  const save = useServerFn(saveFocusConfig);
  const clear = useServerFn(clearFocusToken);
  const test = useServerFn(testFocusConnection);

  const config = useQuery({
    queryKey: ["focus-config"],
    queryFn: () => loadConfig(),
    enabled: isDev,
  });

  const status = useQuery({
    queryKey: ["fiscal-certification-status"],
    queryFn: () => loadStatus(),
    enabled: isDev,
    refetchInterval: 30000,
  });

  const [form, setForm] = useState({
    provedor_nfe: "focus_nfe" as "focus_nfe" | "nenhum" | "plugnotas",
    ambiente_nfe: "homologacao" as "homologacao" | "producao",
    focus_nfe_token: "",
    serie_nfe: 1,
    proximo_numero_nfe: 1,
  });

  useEffect(() => {
    if (config.data) {
      const data = config.data as any;
      setForm(f => ({
        ...f,
        provedor_nfe: data.provedor_nfe ?? "focus_nfe",
        ambiente_nfe: data.ambiente_nfe ?? "homologacao",
        serie_nfe: data.serie_nfe ?? 1,
        proximo_numero_nfe: data.proximo_numero_nfe ?? 1,
        focus_nfe_token: "",
      }));
    }

  }, [config.data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      setForm(f => ({ ...f, focus_nfe_token: "" }));
      qc.invalidateQueries({ queryKey: ["focus-config"] });
      qc.invalidateQueries({ queryKey: ["fiscal-certification-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMut = useMutation({
    mutationFn: () => clear(),
    onSuccess: () => {
      toast.success("Token removido.");
      qc.invalidateQueries({ queryKey: ["focus-config"] });
      qc.invalidateQueries({ queryKey: ["fiscal-certification-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: () => test(),
    onSuccess: (r) => {
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.mensagem);
      qc.invalidateQueries({ queryKey: ["fiscal-certification-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || config.isLoading || status.isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!isDev) {
    return (
      <Card className="p-8 text-center">
        <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <h2 className="font-semibold">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas o cargo Desenvolvedor pode acessar esta página.</p>
      </Card>
    );
  }

  const certStatus = status.data;
  const isAproved = certStatus && certStatus.bloqueadores.length === 0 && certStatus.tokenConfigurado;

  return (
    <div className="space-y-6">
      <div className="bg-amber-500 text-black text-center font-bold py-1 px-4 text-xs tracking-widest uppercase">
        AMBIENTE DE HOMOLOGAÇÃO — SEM VALIDADE FISCAL
      </div>
      <PageHeader
        title="Painel de Certificação Fiscal"
        description="Ambiente de homologação, auditoria de integridade e testes do provedor Focus NFe."
      />


      {/* Status da Certificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={certStatus?.tokenStatus === 'VALID' ? "border-green-500/50 bg-green-500/5" : (certStatus?.tokenStatus === 'INVALID' ? "border-destructive/50 bg-destructive/5" : "border-amber-500/50 bg-amber-500/5")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className={certStatus?.tokenStatus === 'VALID' ? "text-green-500" : (certStatus?.tokenStatus === 'INVALID' ? "text-destructive" : "text-amber-500")} size={18} />
              Status da Credencial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold uppercase">
              {certStatus?.tokenStatus}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {certStatus?.tokenStatus === 'INVALID' ? "Substituição obrigatória" : "Auditoria de autenticação"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="text-blue-500" size={18} />
              Ambiente Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold uppercase">{certStatus?.ambiente}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {certStatus?.tokenConfigurado ? "Token configurado" : "Token ausente"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="text-purple-500" size={18} />
              Integridade DB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {certStatus?.auditoria.rpcsAusentes.length === 0 ? "100% OPERACIONAL" : "PENDÊNCIAS"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {certStatus?.auditoria.rpcsEncontradas.length} RPCs, {certStatus?.auditoria.tabelasEncontradas.length} Tabelas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Configurações Reais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações do Provedor</CardTitle>
              <CardDescription>Gestão segura de credenciais e ambiente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token Focus NFe {(config.data as any)?.token_configurado && <span className="text-xs text-muted-foreground">(deixe em branco para manter)</span>}</Label>
                <div className="flex gap-2">
                    <Input
                        type="password"
                        placeholder={(config.data as any)?.token_configurado ? `Atual: ${(config.data as any).token_preview}` : "Cole o token de homologação"}
                        value={form.focus_nfe_token}
                        onChange={e => setForm(f => ({ ...f, focus_nfe_token: e.target.value }))}
                    />
                    {(config.data as any)?.token_configurado && (
                        <Button variant="outline" size="icon" onClick={() => clearMut.mutate()} disabled={clearMut.isPending} title="Limpar token">

                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Provedor</Label>
                    <Select value={form.provedor_nfe} onValueChange={v => setForm(f => ({ ...f, provedor_nfe: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nenhum">Nenhum</SelectItem>
                            <SelectItem value="focus_nfe">Focus NFe</SelectItem>
                            <SelectItem value="plugnotas">PlugNotas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select value={form.ambiente_nfe} onValueChange={v => setForm(f => ({ ...f, ambiente_nfe: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="homologacao">Homologação</SelectItem>
                            <SelectItem value="producao" disabled>Produção (Bloqueado)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Série NF-e</Label>
                    <Input type="number" value={form.serie_nfe} onChange={e => setForm(f => ({ ...f, serie_nfe: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                    <Label>Próximo Número</Label>
                    <Input type="number" value={form.proximo_numero_nfe} onChange={e => setForm(f => ({ ...f, proximo_numero_nfe: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                      {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending || !certStatus?.tokenConfigurado}>
                      {testMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlugZap className="h-4 w-4 mr-2" />}
                      Testar Conexão
                  </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bloqueadores Reais */}
          {certStatus?.bloqueadores.length ? (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertCircle size={18} />
                  Bloqueadores Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {certStatus.bloqueadores.map((b, i) => (
                    <li key={i} className="text-xs flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-destructive" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {/* Auditoria do Banco */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Auditoria Técnica</CardTitle>
              <CardDescription>Objetos detectados no PostgreSQL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">RPCs Encontradas</Label>
                <div className="flex flex-wrap gap-1">
                  {certStatus?.auditoria.rpcsEncontradas.map(name => (
                    <Badge key={name} variant="secondary" className="text-[10px] font-mono">{name}</Badge>
                  ))}
                  {certStatus?.auditoria.rpcsAusentes.map(name => (
                    <Badge key={name} variant="destructive" className="text-[10px] font-mono">{name}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Tabelas Fiscais</Label>
                <div className="flex flex-wrap gap-1">
                  {certStatus?.auditoria.tabelasEncontradas.map(name => (
                    <Badge key={name} variant="outline" className="text-[10px] font-mono">{name}</Badge>
                  ))}
                  {certStatus?.auditoria.tabelasAusentes.map(name => (
                    <Badge key={name} variant="destructive" className="text-[10px] font-mono">{name}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground">Naturezas Ativas</div>
                      <div className="text-lg font-bold">{certStatus?.cadastros.naturezasAtivas}</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground">Regras Ativas</div>
                      <div className="text-lg font-bold">{certStatus?.cadastros.regrasAtivas}</div>
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs de Atividade</CardTitle>
              <CardDescription>Últimos eventos fiscais registrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certStatus?.logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum log registrado ainda.</p>
                ) : (
                  certStatus?.logs.map((log: any) => (
                    <div key={log.id} className="flex gap-3 text-xs border-b border-muted pb-2 last:border-0">
                      <div className="mt-0.5">
                        {log.acao === 'erro' ? <AlertCircle className="text-destructive h-3 w-3" /> : <Clock className="text-muted-foreground h-3 w-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold uppercase">{log.acao}</div>
                        <div className="text-muted-foreground line-clamp-1">{JSON.stringify(log.response)}</div>
                        <div className="text-[10px] opacity-50">{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                      {log.http_status && (
                        <Badge variant={log.http_status >= 400 ? "destructive" : "outline"} className="h-4 text-[9px]">{log.http_status}</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-center text-xs text-muted-foreground py-4">
        Última auditoria completa: {new Date(certStatus?.timestamp || "").toLocaleString()}
      </div>
    </div>
  );
}
