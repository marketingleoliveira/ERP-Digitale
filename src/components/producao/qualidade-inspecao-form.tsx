import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { registrarInspecao } from "@/services/producao/qualidade.functions";

type Props = {
  opId: string;
  quantidadeProduzida: number;
  onDone?: () => void;
};

export function QualidadeInspecaoForm({ opId, quantidadeProduzida, onDone }: Props) {
  const registrar = useServerFn(registrarInspecao);
  const qc = useQueryClient();
  const [aprov, setAprov] = useState(0);
  const [reprov, setReprov] = useState(0);
  const [repro, setRepro] = useState(0);
  const [defeito, setDefeito] = useState("");
  const [causa, setCausa] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const total = Number(aprov) + Number(reprov) + Number(repro);
  const excedeu = quantidadeProduzida > 0 && total > quantidadeProduzida;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (total <= 0) { toast.error("Informe ao menos uma quantidade."); return; }
    if (excedeu) { toast.error("Soma excede a quantidade produzida."); return; }
    setSaving(true);
    try {
      await registrar({
        data: {
          op_id: opId,
          quantidade_aprovada: Number(aprov),
          quantidade_reprovada: Number(reprov),
          quantidade_reprocesso: Number(repro),
          defeito: defeito || null,
          causa: causa || null,
          observacao: obs || null,
        },
      });
      toast.success("Inspeção registrada.");
      qc.invalidateQueries({ queryKey: ["qualidade"] });
      setAprov(0); setReprov(0); setRepro(0); setDefeito(""); setCausa(""); setObs("");
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Aprovada</Label>
            <Input type="number" min={0} step="0.001" value={aprov} onChange={e => setAprov(Number(e.target.value))} />
          </div>
          <div>
            <Label>Reprovada (refugo)</Label>
            <Input type="number" min={0} step="0.001" value={reprov} onChange={e => setReprov(Number(e.target.value))} />
          </div>
          <div>
            <Label>Reprocesso</Label>
            <Input type="number" min={0} step="0.001" value={repro} onChange={e => setRepro(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Defeito</Label>
            <Input value={defeito} onChange={e => setDefeito(e.target.value)} placeholder="Ex.: furo, mancha, medida" />
          </div>
          <div>
            <Label>Causa raiz</Label>
            <Input value={causa} onChange={e => setCausa(e.target.value)} placeholder="Ex.: agulha, tinta, ajuste" />
          </div>
        </div>

        <div>
          <Label>Observação</Label>
          <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Produzido: <strong>{quantidadeProduzida}</strong> · Somado: <strong>{total}</strong>
            {excedeu && <span className="text-destructive ml-2">Excede o produzido!</span>}
          </div>
          <Button type="submit" disabled={saving || excedeu || total <= 0}>
            {saving ? "Registrando..." : "Registrar inspeção"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
