import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/compras-db";

export const Route = createFileRoute("/_app/compras/fornecedores")({ ssr: false, component: Page });

type F = {
  id?: string; cnpj?: string; razao_social: string; nome_fantasia?: string;
  email?: string; telefone?: string; cidade?: string; uf?: string;
  condicao_pagamento_padrao?: string; prazo_entrega_dias?: number; ativo?: boolean;
};

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await db("fornecedores").select("*").order("razao_social");
      if (error) throw error;
      return data as F[];
    },
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<F | null>(null);
  const [form, setForm] = useState<F>({ razao_social: "" });

  const save = useMutation({
    mutationFn: async () => {
      if (editing?.id) {
        const { error } = await db("fornecedores").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await db("fornecedores").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo."); qc.invalidateQueries({ queryKey: ["fornecedores"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ razao_social: "", ativo: true }); setOpen(true); };
  const openEdit = (f: F) => { setEditing(f); setForm(f); setOpen(true); };
  const set = <K extends keyof F>(k: K, v: F[K]) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">🤝 Fornecedores</h1>
        <Button size="sm" onClick={openNew}><FilePlus2 className="h-4 w-4 mr-1.5" />Novo</Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Razão Social","CNPJ","Cidade/UF","Contato","Cond. Pag.","Ativo","Ações"].map((h) => (
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor.</TableCell></TableRow>
            ) : data.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.razao_social}</TableCell>
                <TableCell className="font-mono text-xs">{f.cnpj ?? "—"}</TableCell>
                <TableCell>{[f.cidade, f.uf].filter(Boolean).join("/") || "—"}</TableCell>
                <TableCell>{f.email ?? f.telefone ?? "—"}</TableCell>
                <TableCell>{f.condicao_pagamento_padrao ?? "—"}</TableCell>
                <TableCell>{f.ativo ? "Sim" : "Não"}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => set("razao_social", e.target.value)} /></div>
            <div><Label>Nome Fantasia</Label><Input value={form.nome_fantasia ?? ""} onChange={(e) => set("nome_fantasia", e.target.value)} /></div>
            <div><Label>CNPJ</Label><Input value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} /></div>
            <div><Label>E-mail</Label><Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={form.uf ?? ""} onChange={(e) => set("uf", e.target.value.toUpperCase())} /></div>
            <div><Label>Condição de Pagamento (ex: 3x30)</Label><Input value={form.condicao_pagamento_padrao ?? ""} onChange={(e) => set("condicao_pagamento_padrao", e.target.value)} /></div>
            <div><Label>Prazo Entrega (dias)</Label><Input type="number" value={form.prazo_entrega_dias ?? 0} onChange={(e) => set("prazo_entrega_dias", Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.razao_social}>{save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
