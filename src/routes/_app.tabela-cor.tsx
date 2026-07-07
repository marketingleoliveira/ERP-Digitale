import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tabela-cor")({
  ssr: false,
  component: TabelaCorPage,
});

type Row = {
  nome: string;
  cnpj: string;
  telefone: string;
  contato: string;
  clara: number;
  media: number;
  escura: number;
  especial: number;
};

const DATA: Row[] = [
  { nome: "ACMC TEXTIL LTDA.", cnpj: "40.931.708/0001-80", telefone: "(11) 9169-9574", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "COFINA", cnpj: "51.685.667/0001-06", telefone: "(11) 40127-411", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "CONFECCOES ARUANDA", cnpj: "04.749.323/0001-33", telefone: "(13) 3278-5908", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "FERA AR COMPRIMIDO LTDA", cnpj: "33.090.595/0001-72", telefone: "(11) 2305-5137", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "FUTURIZE AUTOMACAO INDUSTRIAL LTDA", cnpj: "06.256.066/0001-23", telefone: "(48) 3438-2322", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "GIRACOR TEXTIL LTDA", cnpj: "07.598.373/0001-55", telefone: "(47) 3251-7800", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "HUVISPAN TEXTIL", cnpj: "05.810.004/0001-59", telefone: "(47) 2102-9900", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "IELA COMERCIO DE ROUPAS LTDA", cnpj: "02.184.046/0001-33", telefone: "(11) 3462-6949", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "KOHLER & CIA", cnpj: "82.982.307/0003-61", telefone: "(47) 33546-100", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "RIO DOS CEDROS", cnpj: "85.400.547/0001-37", telefone: "(47) 33861-029", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "SEIREN", cnpj: "43.651.066/0001-54", telefone: "(15) 32381-006", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "TDS", cnpj: "11.767.911/0001-65", telefone: "(11) 3815-7147", contato: "MARCELO", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "TEXTIL CRISTINA", cnpj: "09.571.292/0001-97", telefone: "(47) 33438-000", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "TINTURARIA WILLRICH", cnpj: "20.665.566/0001-40", telefone: "(47) 3354-0040", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "ULTRATEC", cnpj: "52.180.288/0001-27", telefone: "(19) 3455-1540/", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
  { nome: "UNITEX", cnpj: "45.455.194/0001-58", telefone: "(47) 9165-0675", contato: "", clara: 0, media: 0, escura: 0, especial: 0 },
];

const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TabelaCorPage() {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [values, setValues] = useState<Record<number, { clara: string; media: string; escura: string; especial: string }>>({});

  const filtered = useMemo(() => {
    return DATA.filter(
      (r) =>
        r.nome.toLowerCase().includes(nome.toLowerCase()) &&
        r.cnpj.toLowerCase().includes(cnpj.toLowerCase()),
    );
  }, [nome, cnpj]);

  const setVal = (i: number, key: "clara" | "media" | "escura" | "especial", v: string) => {
    setValues((prev) => {
      const base = prev[i] ?? { clara: "", media: "", escura: "", especial: "" };
      return { ...prev, [i]: { ...base, [key]: v } };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-primary">🎨 Listagem Tinturarias</h1>
        <div className="ml-auto flex gap-2">
          <CadastroCorDialog />
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Excel</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Imprimir</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">Nome Fantasia</TableHead>
                <TableHead className="text-primary-foreground font-semibold">CNPJ/CPF</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Telefone</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Contato</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Clara R$</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Média R$</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Escura R$</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Especial R$</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : filtered.map((r, i) => {
                const v = values[i] ?? { clara: "", media: "", escura: "", especial: "" };
                return (
                  <TableRow key={r.cnpj}>
                    <TableCell><button className="text-primary hover:underline font-medium">{r.nome}</button></TableCell>
                    <TableCell>{r.cnpj}</TableCell>
                    <TableCell>{r.telefone}</TableCell>
                    <TableCell>{r.contato}</TableCell>
                    <TableCell className="text-right">
                      <Input value={v.clara} onChange={(e) => setVal(i, "clara", e.target.value)} placeholder={fmt(r.clara)} className="h-8 text-right" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input value={v.media} onChange={(e) => setVal(i, "media", e.target.value)} placeholder={fmt(r.media)} className="h-8 text-right" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input value={v.escura} onChange={(e) => setVal(i, "escura", e.target.value)} placeholder={fmt(r.escura)} className="h-8 text-right" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input value={v.especial} onChange={(e) => setVal(i, "especial", e.target.value)} placeholder={fmt(r.especial)} className="h-8 text-right" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border p-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">Página: 1 / 1</span>
            <div className="flex items-center gap-2">
              <span>Página:</span>
              <select className="h-8 rounded border border-input bg-background px-2 text-sm">
                <option>1</option>
              </select>
            </div>
            <span className="ml-auto text-muted-foreground">Total de Registros: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Nome/Razão:</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-9" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">CNPJ:</label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="h-9" />
            </div>
            <Button variant="secondary">FILTRAR</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const TIPOS = ["Clara", "Média", "Escura", "Especial"];
const TINTURARIAS = DATA.map((d) => d.nome);

function CadastroCorDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    tipo: "",
    cor: "",
    tinturaria: "",
    valor: "",
    valorComplementar: "",
    observacao: "",
  });
  const [tintSuggestOpen, setTintSuggestOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = form.tinturaria.trim().toLowerCase();
    if (q.length < 3) return [];
    return TINTURARIAS.filter((t) => t.toLowerCase().includes(q)).slice(0, 8);
  }, [form.tinturaria]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.codigo.trim() || !form.tipo || !form.cor.trim()) {
      toast.error("Preencha Código, Tipo e Cor.");
      return;
    }
    toast.success(`Cor "${form.cor}" cadastrada.`);
    setOpen(false);
    setForm({ codigo: "", tipo: "", cor: "", tinturaria: "", valor: "", valorComplementar: "", observacao: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nova Cor</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🎨 Cadastro Cor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="codigo"><span className="text-destructive">*</span> Código:</Label>
            <Input id="codigo" value={form.codigo} onChange={(e) => set("codigo", e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Tipo:</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cor"><span className="text-destructive">*</span> Cor:</Label>
            <Input id="cor" value={form.cor} onChange={(e) => set("cor", e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5 md:col-span-2 relative">
            <Label htmlFor="tinturaria">Tinturaria:</Label>
            <Input
              id="tinturaria"
              placeholder="Digite no mínimo as três primeiras letras da Tinturaria"
              value={form.tinturaria}
              onChange={(e) => { set("tinturaria", e.target.value); setTintSuggestOpen(true); }}
              onBlur={() => setTimeout(() => setTintSuggestOpen(false), 150)}
              onFocus={() => setTintSuggestOpen(true)}
            />
            {tintSuggestOpen && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-56 overflow-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
                    onClick={() => { set("tinturaria", s); setTintSuggestOpen(false); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor:</Label>
            <Input id="valor" inputMode="decimal" value={form.valor} onChange={(e) => set("valor", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valorc">Valor Complementar:</Label>
            <Input id="valorc" inputMode="decimal" value={form.valorComplementar} onChange={(e) => set("valorComplementar", e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="obs">Observação:</Label>
            <Textarea id="obs" rows={4} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
