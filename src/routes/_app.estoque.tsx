import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Warehouse } from "lucide-react";
export const Route = createFileRoute("/_app/estoque")({ component: () => (
  <ModulePlaceholder
    title="Estoque"
    description="Movimentações, inventários, reservas, lotes, localização física e rastreabilidade."
    icon={<Warehouse className="h-7 w-7" />}
    features={["Entradas e saídas","Transferências","Inventário","Ajustes","Estoque mín/máx","Reserva para pedidos","Rastreio por lote","Localização física"]}
  />
)});
