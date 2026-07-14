import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, ShieldX, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CertificadoUploadDialog } from "@/components/fiscal/certificado-upload-dialog";
import {
  listarCertificados, ativarCertificado, removerCertificado,
} from "@/services/fiscal/certificado.functions";

export const Route = createFileRoute("/_app/fiscal/certificados")({
  ssr: false,
  component: CertificadosPage,
});

type Certificado = {
  id: string;
  nome: string;
  cnpj: string;
  valido_de: string;
  valido_ate: string;
  ativo: boolean;
  pfx_storage_path: string;
  created_at: string;
};

function diasAte(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function StatusBadge({ dias }: { dias: number }) {
  if (dias < 0) return <Badge variant="destructive"><ShieldX className="h-3 w-3 mr-1" />Expirado</Badge>;
  if (dias <= 30) return <Badge className="bg-amber-500 hover:bg-amber-600"><ShieldAlert className="h-3 w-3 mr-1" />Vence em {dias}d</Badge>;
  return <Badge className="bg-emerald-600 hover:bg-emerald-700"><ShieldCheck className="h-3 w-3 mr-1" />Válido ({dias}d)</Badge>;
}

function CertificadosPage() {
  const listar = useServerFn(listarCertificados);
  const ativar = useServerFn(ativarCertificado);
  const remover = useServerFn(removerCertificado);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["certificados"],
    queryFn: () => listar(),
  });

  const mAtivar = useMutation({
    mutationFn: (id: string) => ativar({ data: { id } }),
    onSuccess: () => { toast.success("Certificado ativado."); qc.invalidateQueries({ queryKey: ["certificados"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const mRemover = useMutation({
    mutationFn: (id: string) => remover({ data: { id } }),
    onSuccess: () => { toast.success("Certificado removido."); qc.invalidateQueries({ queryKey: ["certificados"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const certs = (data?.certificados ?? []) as unknown as Certificado[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">🔐 Certificados Digitais A1</h1>
          <p className="text-sm text-muted-foreground">
            Gestão dos certificados A1 usados para emissão de NF-e junto à SEFAZ.
          </p>
        </div>
        <CertificadoUploadDialog onUploaded={() => qc.invalidateQueries({ queryKey: ["certificados"] })} />
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />Carregando…
          </div>
        ) : certs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum certificado cadastrado. Clique em <span className="font-medium">Novo Certificado A1</span> para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs.map((c) => {
                const dias = diasAte(c.valido_ate);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.nome}
                      {c.ativo && <Badge className="ml-2 bg-primary" variant="default">Ativo</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.cnpj}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(c.valido_de).toLocaleDateString("pt-BR")} → {new Date(c.valido_ate).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell><StatusBadge dias={dias} /></TableCell>
                    <TableCell>
                      <Badge variant="outline">Homologação</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {!c.ativo && dias >= 0 && (
                        <Button size="sm" variant="outline" onClick={() => mAtivar.mutate(c.id)} disabled={mAtivar.isPending}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Ativar
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { if (confirm(`Remover certificado "${c.nome}"?`)) mRemover.mutate(c.id); }}
                        disabled={mRemover.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-4 bg-muted/30 text-sm space-y-1">
        <p className="font-medium text-primary">📖 Sobre esta tela</p>
        <p className="text-muted-foreground">
          Esta é a Fase 1a: cadastro e validação de certificado A1. A transmissão para a SEFAZ
          será habilitada em fase futura pelo microserviço fiscal Node.js. O arquivo .pfx é
          armazenado em bucket privado (<code>fiscal/certificados/</code>) e a senha é cifrada
          com AES-256-GCM usando a chave <code>CERT_ENC_KEY</code>.
        </p>
      </Card>
    </div>
  );
}
