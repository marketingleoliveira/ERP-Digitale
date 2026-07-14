import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/fiscal/nota-fiscal-upload")({ ssr: false, component: UploadNFPage });

type Parsed = { numero: string; serie: string; chave: string; valor: number; data: string };

function parseNFeXml(xml: string): Parsed | null {
  const num = xml.match(/<nNF>(\d+)<\/nNF>/)?.[1] ?? "";
  const serie = xml.match(/<serie>(\d+)<\/serie>/)?.[1] ?? "1";
  const chave = xml.match(/Id="NFe(\d{44})"/)?.[1] ?? "";
  const valor = Number(xml.match(/<vNF>([\d.]+)<\/vNF>/)?.[1] ?? "0");
  const data = xml.match(/<dhEmi>([^<]+)<\/dhEmi>/)?.[1]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  if (!num) return null;
  return { numero: num, serie, chave, valor, data };
}

function UploadNFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFile(f: File) {
    setFile(f); setLoading(true);
    try {
      const text = await f.text();
      const p = parseNFeXml(text);
      if (!p) { toast.error("Não foi possível ler o XML."); setParsed(null); return; }
      setParsed(p);
      toast.success("XML lido com sucesso.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from("notas_fiscais" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert({
        tipo: "entrada", numero: parsed.numero, serie: parsed.serie,
        data_emissao: parsed.data, valor_total: parsed.valor,
        chave_acesso: parsed.chave, status: "emitida",
      });
      if (error) throw error;
      toast.success("Nota importada.");
      setFile(null); setParsed(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold text-primary">📎 Nota Fiscal Upload</h1>
      <Card className="p-6 space-y-4">
        <div>
          <Label>Arquivo XML da NF-e</Label>
          <Input type="file" accept=".xml" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p className="text-xs text-muted-foreground mt-1">Selecione o arquivo XML autorizado.</p>
        </div>
        {loading && <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Lendo XML…</div>}
        {parsed && (
          <div className="rounded border border-border bg-muted/30 p-4 space-y-1 text-sm">
            <div className="flex items-center gap-2 font-medium text-primary"><FileCheck2 className="h-4 w-4" />{file?.name}</div>
            <div>Número: <span className="font-mono">{parsed.numero}</span></div>
            <div>Série: {parsed.serie}</div>
            <div>Chave: <span className="font-mono text-xs">{parsed.chave || "—"}</span></div>
            <div>Data: {new Date(parsed.data).toLocaleDateString("pt-BR")}</div>
            <div>Valor: R$ {parsed.valor.toFixed(2)}</div>
          </div>
        )}
        <Button onClick={handleSave} disabled={!parsed || saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
          Importar nota
        </Button>
      </Card>
    </div>
  );
}
