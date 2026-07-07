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
        "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors",
        checked ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      aria-label={checked ? "Habilitado" : "Desabilitado"}
    >
      {checked ? "ON" : "OFF"}
    </button>
  );
}


export const rowDisabledClass = "bg-destructive/10";
