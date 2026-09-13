'use client';

import { useCallback, useMemo, useState } from 'react';

export type FilterChip = { key: string; value: string | null };

export function useFilter<T>(data: T[]) {
  const [filters, setFilters] = useState<FilterChip[]>([]);

  const addFilter = useCallback((key: string) => {
    setFilters((prev) => {
      if (prev.some((f) => f.key === key)) return prev;
      return [...prev, { key, value: null }];
    });
  }, []);

  const setFilterValue = useCallback((key: string, value: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value } : f))
    );
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // For each chip, compute options from `data` filtered by every OTHER active filter.
  // This gives faceted drill-down: selecting one filter narrows the options of siblings.
  const optionsMap = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const { key } of filters) {
      const otherActive = filters.filter((f) => f.key !== key && f.value !== null);
      const pool =
        otherActive.length === 0
          ? data
          : data.filter((row) =>
              otherActive.every(
                ({ key: k, value }) => String(row[k as keyof T]) === value
              )
            );
      const seen = new Set<string>();
      for (const row of pool) {
        const val = row[key as keyof T];
        if (val !== null && val !== undefined && val !== '') {
          seen.add(String(val));
        }
      }
      result[key] = Array.from(seen).sort();
    }
    return result;
  }, [data, filters]);

  const filteredData = useMemo(() => {
    const active = filters.filter((f) => f.value !== null);
    if (active.length === 0) return data;
    return data.filter((row) =>
      active.every(({ key, value }) => String(row[key as keyof T]) === value)
    );
  }, [data, filters]);

  const getOptionsFor = useCallback(
    (key: string): string[] => optionsMap[key] ?? [],
    [optionsMap]
  );

  return {
    filters,
    addFilter,
    setFilterValue,
    removeFilter,
    clearFilters,
    filteredData,
    getOptionsFor,
  };
}
