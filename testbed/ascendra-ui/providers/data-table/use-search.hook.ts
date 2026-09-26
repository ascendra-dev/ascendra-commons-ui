'use client';

import { useCallback, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import type { ColumnDef, ColumnType } from './data-table.types';

function defaultSearchValue(val: unknown, type: ColumnType): string {
  if (type === 'date') {
    return new Date(val as string).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (type === 'number') return (val as number).toLocaleString();
  return String(val ?? '');
}

/**
 * A column's own `searchValue` takes priority (so search/highlight agree
 * with a custom-formatted cell); otherwise falls back to the built-in
 * per-type formatter, unchanged from before this override existed.
 */
function resolveSearchValue<T extends object>(item: T, key: keyof T, columns?: ColumnDef<T>[]): string {
  const col = columns?.find((c) => c.key === key);
  if (col?.searchValue) return col.searchValue(item[key], item);
  return defaultSearchValue(item[key], col?.type ?? 'string');
}

export function useSearch<T extends object>(
  data: T[],
  columns?: ColumnDef<T>[],
  keys?: (keyof T)[],
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fuzzy, setFuzzy] = useState(false);

  const fuseKeys = useMemo(() => {
    if (keys) return keys.map(String);
    if (columns?.length) return columns.map((c) => String(c.key));
    if (data.length > 0) return Object.keys(data[0]);
    return [];
  }, [keys, columns, data]);

  const fuse = useMemo(() => {
    if (!fuzzy || !fuseKeys.length) return null;
    return new Fuse(data, {
      // A per-key getFn, not a raw property name, so a column with its own
      // `searchValue` gets indexed on that (e.g. a formatted date string)
      // instead of the raw field value — keeping fuzzy match/highlight
      // ranges aligned with what a custom-formatted cell actually displays.
      keys: fuseKeys.map((key) => ({
        name: key,
        getFn: (obj: T) => resolveSearchValue(obj, key as keyof T, columns),
      })),
      includeMatches: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [data, fuseKeys, fuzzy, columns]);

  const { filteredData, rangesMap } = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return { filteredData: data, rangesMap: null };

    if (fuzzy && fuse) {
      const results = fuse.search(term);
      const map = new WeakMap<object, Map<string, [number, number][]>>();
      for (const result of results) {
        const keyMap = new Map<string, [number, number][]>();
        for (const match of result.matches ?? []) {
          if (match.key && match.indices) {
            keyMap.set(match.key, match.indices as [number, number][]);
          }
        }
        map.set(result.item as object, keyMap);
      }
      return { filteredData: results.map((r) => r.item), rangesMap: map };
    }

    const termLower = term.toLowerCase();
    const filtered = data.filter((item) => {
      const searchKeys = keys ?? columns?.map((c) => c.key) ?? (Object.keys(item) as (keyof T)[]);
      return searchKeys.some((key) => resolveSearchValue(item, key, columns).toLowerCase().includes(termLower));
    });
    return { filteredData: filtered, rangesMap: null };
  }, [data, columns, keys, searchTerm, fuzzy, fuse]);

  const getRanges = useCallback(
    (item: unknown, key: PropertyKey): [number, number][] | undefined =>
      rangesMap?.get(item as object)?.get(String(key)),
    [rangesMap]
  );

  return { searchTerm, setSearchTerm, fuzzy, setFuzzy, filteredData, getRanges };
}
