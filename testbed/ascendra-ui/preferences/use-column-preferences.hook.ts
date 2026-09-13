'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readTablePreferences, writeTablePreferences } from './preferences.storage';
import type { ColumnDef } from '@/ascendra-ui/providers/data-table/data-table.types';
import type { ColumnPreferences } from './preferences.types';

function mergeColumnPreferences<T>(
  base: ColumnDef<T>[],
  persisted: ColumnPreferences
): ColumnDef<T>[] {
  const byKey = new Map(base.map((col) => [String(col.key), col]));

  const ordered: ColumnDef<T>[] = [];
  for (const key of persisted.order) {
    const col = byKey.get(key);
    if (!col) continue; // column removed from code — skip
    // freeze: true columns are always visible regardless of saved preference
    const active = col.freeze ? true : (persisted.visibility[key] ?? col.active ?? true);
    ordered.push({ ...col, active });
    byKey.delete(key);
  }

  // Columns added in code after the preference was saved — append at end
  for (const col of byKey.values()) {
    ordered.push(col);
  }

  return ordered;
}

/** Encodes order + visibility as a single comparable string. */
function columnSignature<T>(cols: ColumnDef<T>[]): string {
  return cols.map((c) => `${String(c.key)}:${c.active !== false}`).join(',');
}

export type UseColumnPersistenceResult = {
  /** Persist the current column state to localStorage. No-op when tableId is undefined. */
  save: () => void;
  /** True when the current columns differ from the last saved (or loaded) state. */
  isDirty: boolean;
};

/**
 * Side-effect-only hook that adds on-demand localStorage persistence to an
 * existing column state owned by the caller.
 *
 * - Accepts the stable useState setter directly so the React Compiler can
 *   verify memoization stability.
 * - Hydration is non-blocking: the caller renders with its initial columns on
 *   frame 1; stored preferences are applied via setColumns after mount.
 * - Does NOT auto-save. Call save() explicitly (e.g. from a Save button).
 * - isDirty is false until the user makes a change relative to the loaded state.
 * - When tableId is undefined, save() is a no-op and isDirty is always false.
 */
export function useColumnPersistence<T>(
  tableId: string | undefined,
  columns: ColumnDef<T>[],
  setColumns: Dispatch<SetStateAction<ColumnDef<T>[]>>,
  fallbackColumns: ColumnDef<T>[]
): UseColumnPersistenceResult {
  // Capture fallbackColumns at mount — avoids re-hydrating on every re-render
  // when the parent passes an inline array reference.
  const fallbackRef = useRef(fallbackColumns);

  // The signature of what is currently persisted (or the initial fallback when
  // no tableId is provided). This is the baseline for isDirty comparison.
  const [savedSignature, setSavedSignature] = useState(() =>
    columnSignature(fallbackColumns)
  );

  // Hydrate from storage after mount (or when tableId changes).
  useEffect(() => {
    if (!tableId) return;
    const stored = readTablePreferences(tableId);
    if (stored?.columns) {
      const merged = mergeColumnPreferences(fallbackRef.current, stored.columns);
      setColumns(merged);
      setSavedSignature(columnSignature(merged));
    }
  }, [tableId, setColumns]);

  const save = useCallback(() => {
    if (!tableId) return;
    writeTablePreferences(tableId, {
      columns: {
        order: columns.map((c) => String(c.key)),
        visibility: Object.fromEntries(
          columns.map((c) => [String(c.key), c.active !== false])
        ),
      },
    });
    setSavedSignature(columnSignature(columns));
  }, [tableId, columns]);

  const isDirty = tableId !== undefined && columnSignature(columns) !== savedSignature;

  return { save, isDirty };
}
