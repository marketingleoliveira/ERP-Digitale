import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { Truck } from "lucide-react";
export const Route = createFileRoute("/_app/fornecedores")({ component: () => (
  <ModulePlaceholder
    title="Fornecedores"
    description="Cadastro completo, documentos fiscais, produtos fornecidos, histórico de compras e financeiro."
    icon={<Truck className="h-7 w-7" />}
    features={["Cadastro PF/PJ","Documentos fiscais","Produtos fornecidos","Histórico de compras","Contas a pagar","Avaliação de fornecedor"]}
  />
)});
