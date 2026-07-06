import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AnyRecord = Record<string, unknown>;

interface RecordDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  tableName: string;
  record: AnyRecord | null;
  onSaved?: () => void;
  /** Map of column name → user-friendly label. */
  labels?: Record<string, string>;
  /** Column names that should not be shown at all. */
  hidden?: string[];
  /** Column names that show as read-only even in edit mode. */
  readonly?: string[];
  /** Column names that should render as textarea in edit mode. */
  textareas?: string[];
}

const DEFAULT_HIDDEN = new Set([
  "id", "created_at", "updated_at", "owner_id",
]);

const humanize = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isPlainDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v);

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const formatValue = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (isPlainDate(v)) return new Date(v).toLocaleString("pt-BR");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

export function RecordDetailDialog({
  open, onOpenChange, title, tableName, record, onSaved,
  labels = {}, hidden = [], readonly = [], textareas = [],
}: RecordDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AnyRecord>({});

  useEffect(() => {
    setForm(record ?? {});
    setEditing(false);
  }, [record]);

  const hiddenSet = useMemo(
    () => new Set([...DEFAULT_HIDDEN, ...hidden]),
    [hidden],
  );
  const readonlySet = useMemo(() => new Set(readonly), [readonly]);
  const textareaSet = useMemo(() => new Set(textareas), [textareas]);

  if (!record) return null;

  const entries = Object.entries(record).filter(([k]) => !hiddenSet.has(k));

  const setField = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!record.id) return;
    setSaving(true);
    // Build payload with only changed fields.
    const payload: AnyRecord = {};
    for (const [k, v] of Object.entries(form)) {
      if (hiddenSet.has(k) || readonlySet.has(k)) continue;
      if (v !== record[k]) payload[k] = v === "" ? null : v;
    }
    if (Object.keys(payload).length === 0) {
      setSaving(false);
      setEditing(false);
      toast.info("Nenhuma alteração para salvar");
      return;
    }
    const { error } = await supabase
      .from(tableName as never)
      .update(payload as never)
      .eq("id", record.id as string);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Alterações salvas");
    setEditing(false);
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {editing ? "Edite os campos e salve as alterações." : "Detalhes completos do cadastro."}
            </DialogDescription>
          </div>
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1.5" />Editar
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { setForm(record); setEditing(false); }}>
              <X className="h-4 w-4 mr-1.5" />Cancelar edição
            </Button>
          )}
        </DialogHeader>

        <div className="overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 py-2 pr-1">
          {entries.map(([key, value]) => {
            const label = labels[key] ?? humanize(key);
            const current = form[key];
            const isReadonly = readonlySet.has(key);
            const isTextarea = textareaSet.has(key);
            const isBool = typeof value === "boolean";
            const isArr = Array.isArray(value);
            const isNumber = typeof value === "number";
            const isFullWidth = isTextarea || key === "descricao" || key === "observacao" || key === "endereco";

            return (
              <div
                key={key}
                className={`space-y-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}
              >
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  {label}
                </Label>

                {!editing ? (
                  <div className="min-h-9 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm break-words">
                    {isBool ? (
                      <Badge className={value ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                        {formatValue(value)}
                      </Badge>
                    ) : isUuid(value) ? (
                      <span className="font-mono text-xs text-muted-foreground">{String(value)}</span>
                    ) : (
                      <span>{formatValue(value)}</span>
                    )}
                  </div>
                ) : isReadonly ? (
                  <Input value={formatValue(current)} readOnly disabled />
                ) : isBool ? (
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      checked={Boolean(current)}
                      onCheckedChange={(v) => setField(key, v)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {current ? "Sim" : "Não"}
                    </span>
                  </div>
                ) : isArr ? (
                  <Input
                    value={Array.isArray(current) ? (current as unknown[]).join(", ") : ""}
                    onChange={(e) =>
                      setField(
                        key,
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      )
                    }
                    placeholder="Separado por vírgula"
                  />
                ) : isTextarea ? (
                  <Textarea
                    rows={3}
                    value={(current as string | null) ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                ) : isNumber ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={(current as number | null) ?? ""}
                    onChange={(e) =>
                      setField(key, e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                ) : (
                  <Input
                    value={(current as string | null) ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {editing && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Salvar alterações
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
