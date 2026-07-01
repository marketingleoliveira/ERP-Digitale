import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { ShoppingCart } from "lucide-react";
export const Route = createFileRoute("/_app/compras")({ component: () => (
  <ModulePlaceholder
    title="Compras"
    description="Solicitações, pedidos de compra, recebimento, conferência e integração com estoque e financeiro."
    icon={<ShoppingCart className="h-7 w-7" />}
    features={["Solicitação de compra","Cotação","Pedido de compra","Recebimento","Conferência","Integração estoque/financeiro"]}
  />
)});
