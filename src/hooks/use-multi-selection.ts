import { useCallback, useMemo, useState } from "react";

/**
 * Reusable multi-selection helper for tables of rows keyed by string id.
 *
 * Pattern used across all cadastros (Agulha, Variante, Cor, Tinturarias, etc.):
 * - Header checkbox toggles all currently visible rows.
 * - Row checkbox toggles that row.
 * - ALTERAR enabled only when exactly 1 row is selected.
 * - EXCLUIR uses `ids` for bulk delete via `.in("id", ids)`.
 */
export function useMultiSelection<T extends { id: string }>(currentRows: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? new Set(currentRows.map((r) => r.id)) : new Set());
    },
    [currentRows],
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selectedRows = useMemo(
    () => currentRows.filter((r) => selectedIds.has(r.id)),
    [currentRows, selectedIds],
  );
  const singleSelected = selectedRows.length === 1 ? selectedRows[0] : null;
  const allSelected = currentRows.length > 0 && currentRows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedRows.length > 0 && !allSelected;

  return {
    selectedIds,
    selectedRows,
    singleSelected,
    allSelected,
    someSelected,
    toggleOne,
    toggleAll,
    clear,
    isSelected: (id: string) => selectedIds.has(id),
    count: selectedRows.length,
  };
}
