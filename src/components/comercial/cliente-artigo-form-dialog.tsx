import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import {
  criarClienteArtigo, atualizarClienteArtigo,
  type ClienteArtigoInput,
} from "@/services/comercial/cliente-artigo.functions";

interface Props {
  trigger?: React.ReactNode;
  regraId?: string;
  initial?: Partial<ClienteArtigoInput>;
}

const vazio = (): ClienteArtigoInput => ({
  cliente_id: "",
  artigo_id: "",
  produto_id: null,
  variante_id: null,
  codigo_cliente: null,
  descricao_comercial: null,
  unidade: "kg",
  preco_negociado: 0,
  quantidade_minima: 0,
  desconto_maximo_pct: 0,
  prazo_entrega_dias: null,
  condicao_pagamento: null,
  representante_id: null,
  vigencia_inicio: new Date().toISOString().slice(0, 10),
  vigencia_fim: null,
  ativo: true,
  observacoes: null,
});

export function ClienteArtigoFormDialog({ trigger, regraId, initial }: Props) {
  const qc = useQueryClient();
  const criar = useServerFn(criarClienteArtigo);
  const atualizar = useServerFn(atualizarClienteArtigo);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClienteArtigoInput>(() => ({ ...vazio(), ...initial }));

  useEffect(() => {
    if (open) setForm({ ...vazio(), ...initial });
  }, [open, initial]);

  const { data: clientes = [] } = useQuery({
    queryKey: ["ca-clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, razao_social, nome_fantasia").order("razao_social").limit(500);
      return data ?? [];
    },
    enabled: open,
  });
  const { data: artigos = [] } = useQuery({
    queryKey: ["ca-artigos"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("id, codigo, descricao").order("codigo").limit(500);
      return data ?? [];
    },
    enabled: open,
  });

  const set = <K extends keyof ClienteArtigoInput>(k: K, v: ClienteArtigoInput[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.cliente_id || !form.artigo_id) {
      toast.error("Cliente e artigo são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      if (regraId) {
        await atualizar({ data: { id: regraId, input: form } });
        toast.success("Regra atualizada");
      } else {
        await criar({ data: form });
        toast.success("Regra criada");
      }
      qc.invalidateQueries({ queryKey: ["cliente-artigo-list"] });
      qc.invalidateQueries({ queryKey: ["cliente-artigo", regraId] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button><Plus className="w-4 h-4 mr-2" />Nova regra</Button>}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{regraId ? "Editar" : "Nova"} regra Cliente × Artigo</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Cliente *</Label>
            <Select value={form.cliente_id} onValueChange={v => set("cliente_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Artigo *</Label>
            <Select value={form.artigo_id} onValueChange={v => set("artigo_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {artigos.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.codigo} — {a.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Código no cliente</Label>
            <Input value={form.codigo_cliente ?? ""} onChange={e => set("codigo_cliente", e.target.value || null)} />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input value={form.unidade} onChange={e => set("unidade", e.target.value)} />
          </div>

          <div className="col-span-2">
            <Label>Descrição comercial</Label>
            <Input value={form.descricao_comercial ?? ""} onChange={e => set("descricao_comercial", e.target.value || null)} />
          </div>

          <div>
            <Label>Preço negociado *</Label>
            <Input type="number" step="0.0001" value={form.preco_negociado}
              onChange={e => set("preco_negociado", Number(e.target.value))} />
          </div>
          <div>
            <Label>Quantidade mínima</Label>
            <Input type="number" step="0.001" value={form.quantidade_minima}
              onChange={e => set("quantidade_minima", Number(e.target.value))} />
          </div>

          <div>
            <Label>Desconto máx. (%)</Label>
            <Input type="number" step="0.01" value={form.desconto_maximo_pct}
              onChange={e => set("desconto_maximo_pct", Number(e.target.value))} />
          </div>
          <div>
            <Label>Prazo de entrega (dias)</Label>
            <Input type="number" value={form.prazo_entrega_dias ?? ""}
              onChange={e => set("prazo_entrega_dias", e.target.value ? Number(e.target.value) : null)} />
          </div>

          <div>
            <Label>Condição de pagamento</Label>
            <Input value={form.condicao_pagamento ?? ""} onChange={e => set("condicao_pagamento", e.target.value || null)} />
          </div>
          <div>
            <Label>Vigência início *</Label>
            <Input type="date" value={form.vigencia_inicio}
              onChange={e => set("vigencia_inicio", e.target.value)} />
          </div>

          <div>
            <Label>Vigência fim</Label>
            <Input type="date" value={form.vigencia_fim ?? ""}
              onChange={e => set("vigencia_fim", e.target.value || null)} />
          </div>
          <div className="flex items-end gap-3">
            <Switch checked={form.ativo} onCheckedChange={v => set("ativo", v)} id="ativo" />
            <Label htmlFor="ativo">Ativo</Label>
          </div>

          <div className="col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes ?? ""} onChange={e => set("observacoes", e.target.value || null)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
