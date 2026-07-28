import { useRouterState } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHelp } from "@/components/help/HelpProvider";

export interface PageHelpButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
  /** Força um módulo específico. Sem isso, resolve pela rota atual. */
  helpId?: string;
  /** Exibe o rótulo "Ajuda" ao lado do ícone. */
  showLabel?: boolean;
}

/**
 * Botão de ajuda contextual para cabeçalhos de páginas operacionais.
 * Não contém texto de ajuda: todo o conteúdo vem do HelpRegistry.
 */
export function PageHelpButton({
  helpId,
  showLabel = false,
  className,
  variant = "ghost",
  size,
  ...props
}: PageHelpButtonProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { getHelp, getHelpForPath, openHelp, openHelpForPath } = useHelp();

  const content = helpId ? getHelp(helpId) : getHelpForPath(pathname);
  if (!content) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (showLabel ? "sm" : "icon")}
      aria-label={`Ajuda sobre ${content.summary}`}
      title={`Ajuda — ${content.summary}`}
      onClick={() => (helpId ? openHelp(helpId) : openHelpForPath(pathname))}
      className={cn("text-primary hover:bg-primary/10", className)}
      {...props}
    >
      <CircleHelp className="h-4 w-4" aria-hidden="true" />
      {showLabel && <span className="ml-1.5 text-xs font-semibold">Ajuda</span>}
    </Button>
  );
}
