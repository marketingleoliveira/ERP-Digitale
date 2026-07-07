import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
  title?: string;
};

export function StatusDot({ checked, onToggle, disabled, title }: Props) {
  return (
    <button
      type="button"
      title={title ?? (checked ? "Clique para desabilitar" : "Clique para habilitar")}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!checked);
      }}
      className={cn(
        "inline-block h-3 w-3 rounded-full transition-transform hover:scale-125",
        checked ? "bg-emerald-500" : "bg-rose-400",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      aria-label={checked ? "Habilitado" : "Desabilitado"}
    />
  );
}

export const rowDisabledClass = "bg-destructive/10";
