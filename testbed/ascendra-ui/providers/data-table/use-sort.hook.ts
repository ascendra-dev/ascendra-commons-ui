'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef, ColumnType, SortConfig } from './data-table.types';

function sortValue(val: unknown, type: ColumnType): string | number {
  if (type === 'date') return new Date(val as string).getTime();
  if (type === 'number') return val as number;
  return String(val);
}

function sortData<T>(
  data: T[],
  config: SortConfig<T> | null,
  columns: ColumnDef<T>[],
): T[] {
  if (!config) return data;
  const colType = columns.find((c) => c.key === config.key)?.type ?? 'string';
  return [...data].sort((a, b) => {
    const aVal = sortValue(a[config.key], colType);
    const bVal = sortValue(b[config.key], colType);
    if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function useSort<T>(data: T[], columns: ColumnDef<T>[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

  // Use a ref so handleSort stays stable even as columns update.
  // Columns are read at call time (not captured at creation time), which is correct
  // for an event handler that checks sortability on demand.
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const handleSort = useCallback((key: PropertyKey) => {
    const col = columnsRef.current.find((c) => c.key === key);
    if (col?.sortable === false) return;
    const tKey = key as keyof T;
    setSortConfig((prev) => {
      if (prev?.key !== tKey) return { key: tKey, direction: 'asc' };
      if (prev.direction === 'asc') return { key: tKey, direction: 'desc' };
      return { key: tKey, direction: 'asc' };
    });
  }, []);

  const clearSort = useCallback(() => setSortConfig(null), []);

  const sortedData = useMemo(
    () => sortData(data, sortConfig, columns),
    [data, sortConfig, columns],
  );

  return { sortConfig, handleSort, clearSort, sortedData };
}
