import { type ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

interface Props {
  title: string;
  description: string;
  features: string[];
  icon?: ReactNode;
}

export function ModulePlaceholder({ title, description, features, icon }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />Novo</Button>}
      />
      <Card>
        <CardContent className="p-10">
          <div className="flex flex-col items-center text-center max-w-xl mx-auto">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon ?? <Sparkles className="h-7 w-7" />}
            </div>
            <h2 className="text-xl font-semibold">Módulo em construção</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Este módulo faz parte da roadmap do Sistema Digitale Têxtil e será liberado nas próximas fases.
              A estrutura, permissões e integrações já estão previstas na arquitetura.
            </p>
            <div className="mt-6 grid w-full gap-2 text-left sm:grid-cols-2">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
