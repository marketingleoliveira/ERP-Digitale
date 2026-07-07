import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Empresa = {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  regime_tributario: string;
  cnae: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  codigo_municipio: string;
  telefone: string;
  email: string;
  ambiente_nfe: string;
  serie_nfe: number;
  proximo_numero_nfe: number;
  provedor_nfe: string;
};

const empty: Empresa = {
  razao_social: "", nome_fantasia: "", cnpj: "", inscricao_estadual: "",
  inscricao_municipal: "", regime_tributario: "simples", cnae: "",
  logradouro: "", numero: "", complemento: "", bairro: "", cidade: "",
  uf: "", cep: "", codigo_municipio: "", telefone: "", email: "",
  ambiente_nfe: "homologacao", serie_nfe: 1, proximo_numero_nfe: 1,
  provedor_nfe: "nenhum",
};

export function EmpresaForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresa" as never).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as Empresa | null;
    },
  });
  const [form, setForm] = useState<Empresa>(empty);
  useEffect(() => { if (data) setForm({ ...empty, ...data }); }, [data]);

  const save = useMutation({
    mutationFn: async (f: Empresa) => {
      if (f.id) {
        const { error } = await (supabase.from("empresa" as never) as never as {
          update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> }
        }).update(f).eq("id", f.id);
        if (error) throw error;
      } else {
        const { id: _omit, ...insert } = f;
        void _omit;
        const { error } = await supabase.from("empresa" as never).insert(insert as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Dados da empresa salvos."); qc.invalidateQueries({ queryKey: ["empresa"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  const set = <K extends keyof Empresa>(k: K, v: Empresa[K]) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-primary">🏢 Dados da Empresa (Emissor NF-e)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} /></div>
          <div><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} /></div>
          <div><Label>CNPJ *</Label><Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" /></div>
          <div><Label>Inscrição Estadual</Label><Input value={form.inscricao_estadual} onChange={e => set("inscricao_estadual", e.target.value)} /></div>
          <div><Label>Inscrição Municipal</Label><Input value={form.inscricao_municipal} onChange={e => set("inscricao_municipal", e.target.value)} /></div>
          <div>
            <Label>Regime Tributário</Label>
            <Select value={form.regime_tributario} onValueChange={v => set("regime_tributario", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
                <SelectItem value="mei">MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>CNAE</Label><Input value={form.cnae} onChange={e => set("cnae", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-primary">📍 Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Label>Logradouro</Label><Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} /></div>
          <div><Label>Número</Label><Input value={form.numero} onChange={e => set("numero", e.target.value)} /></div>
          <div><Label>Complemento</Label><Input value={form.complemento} onChange={e => set("complemento", e.target.value)} /></div>
          <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => set("bairro", e.target.value)} /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} /></div>
          <div><Label>UF</Label><Input value={form.uf} onChange={e => set("uf", e.target.value.toUpperCase())} maxLength={2} /></div>
          <div><Label>CEP</Label><Input value={form.cep} onChange={e => set("cep", e.target.value)} /></div>
          <div><Label>Cód. Município (IBGE)</Label><Input value={form.codigo_municipio} onChange={e => set("codigo_municipio", e.target.value)} /></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} /></div>
          <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-primary">⚙️ Configuração NF-e / SEFAZ</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Ambiente</Label>
            <Select value={form.ambiente_nfe} onValueChange={v => set("ambiente_nfe", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação (testes)</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Provedor SEFAZ</Label>
            <Select value={form.provedor_nfe} onValueChange={v => set("provedor_nfe", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum (só rascunho)</SelectItem>
                <SelectItem value="focus_nfe">Focus NFe</SelectItem>
                <SelectItem value="plugnotas">PlugNotas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Série NF-e</Label><Input type="number" value={form.serie_nfe} onChange={e => set("serie_nfe", Number(e.target.value))} /></div>
          <div><Label>Próximo Nº</Label><Input type="number" value={form.proximo_numero_nfe} onChange={e => set("proximo_numero_nfe", Number(e.target.value))} /></div>
        </div>
        <p className="text-xs text-muted-foreground">
          ℹ️ Ao selecionar Focus NFe ou PlugNotas, é necessário cadastrar o token (FOCUS_NFE_TOKEN ou PLUGNOTAS_TOKEN)
          nas configurações de secrets do projeto. Certificado A1 é registrado no painel do provedor.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
