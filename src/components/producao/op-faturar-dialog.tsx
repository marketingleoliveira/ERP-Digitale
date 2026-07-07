/**
 * OpFaturarDialog — dispara o pré-faturamento e leva o usuário à NF-e gerada.
 * O usuário apenas confere os dados no Fiscal; nada é digitado novamente.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Receipt, Loader2 } from "lucide-react";
import { gerarPreFaturamento } from "@/services/fiscal/pre-faturamento.functions";

interface OpFaturarDialogProps {
  opId: string;
  opNumero: number | string;
  disabled?: boolean;
}

export function OpFaturarDialog({ opId, opNumero, disabled }: OpFaturarDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const gerar = useServerFn(gerarPreFaturamento);
  const navigate = useNavigate();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await gerar({ data: { opId } });
      toast.success("Pré-faturamento gerado.");
      setOpen(false);
      navigate({ to: "/fiscal", search: { nf: res.nota_fiscal_id } as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar pré-faturamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Receipt className="mr-2 h-4 w-4" />
          Gerar Pré-Faturamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Pré-Faturamento — OP {opNumero}</DialogTitle>
          <DialogDescription>
            O sistema criará uma NF-e em rascunho com cliente, itens, quantidades aprovadas,
            variantes, lotes e valores da OP. Você poderá revisar antes de transmitir à SEFAZ.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e abrir NF-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
