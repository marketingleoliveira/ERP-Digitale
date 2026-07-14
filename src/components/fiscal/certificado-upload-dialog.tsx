import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadCertificado } from "@/services/fiscal/certificado.functions";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve(res.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CertificadoUploadDialog({ onUploaded }: { onUploaded?: () => void }) {
  const upload = useServerFn(uploadCertificado);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Selecione o arquivo .pfx");
    if (file.size > 500 * 1024) return toast.error("Arquivo muito grande (máx. 500KB).");
    setLoading(true);
    try {
      const pfxBase64 = await fileToBase64(file);
      const res = await upload({ data: { nome, senha, pfxBase64 } });
      toast.success(`Certificado "${(res.certificado as { titular?: string }).titular ?? nome}" cadastrado.`);
      setOpen(false);
      setNome(""); setSenha(""); setFile(null);
      onUploaded?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Upload className="h-4 w-4 mr-1.5" />Novo Certificado A1</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Certificado Digital A1</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome interno</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Digitale Têxtil - Matriz"
              required minLength={3} maxLength={120}
            />
          </div>
          <div>
            <Label>Arquivo .pfx</Label>
            <Input
              type="file"
              accept=".pfx,.p12,application/x-pkcs12"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              O arquivo é armazenado em bucket privado; a senha é cifrada com AES-256 antes de persistir.
            </p>
          </div>
          <div>
            <Label>Senha do PFX</Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required maxLength={200}
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Enviar e validar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
