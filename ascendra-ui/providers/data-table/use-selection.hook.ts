'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useSelection<T>(
  pagedData: T[],
  allData: T[],
  getRowId: ((row: T) => string) | undefined,
) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Read data and getRowId via refs so callbacks stay stable.
  const pagedDataRef = useRef(pagedData);
  useEffect(() => { pagedDataRef.current = pagedData; }, [pagedData]);

  const allDataRef = useRef(allData);
  useEffect(() => { allDataRef.current = allData; }, [allData]);

  const getRowIdRef = useRef(getRowId);
  useEffect(() => { getRowIdRef.current = getRowId; }, [getRowId]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Page-scoped: unions current page rows into the existing selection.
  const selectAll = useCallback(() => {
    const fn = getRowIdRef.current;
    if (!fn) return;
    setSelectedRows((prev) => {
      const next = new Set(prev);
      pagedDataRef.current.forEach((row) => next.add(fn(row)));
      return next;
    });
  }, []);

  // Full-data scope: selects every row across all pages.
  const selectAllData = useCallback(() => {
    const fn = getRowIdRef.current;
    if (!fn) return;
    setSelectedRows(new Set(allDataRef.current.map(fn)));
  }, []);

  const clearSelection = useCallback(() => setSelectedRows(new Set()), []);

  // Page-scoped: removes only current page rows from the selection.
  const clearPage = useCallback(() => {
    const fn = getRowIdRef.current;
    if (!fn) return;
    const pageIds = new Set(pagedDataRef.current.map(fn));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const isRowSelected = useCallback(
    (id: string) => selectedRows.has(id),
    [selectedRows],
  );

  // True when every row on the current page is selected.
  const isAllSelected = useMemo(() => {
    if (!getRowId || pagedData.length === 0) return false;
    return pagedData.every((row) => selectedRows.has(getRowId(row)));
  }, [pagedData, selectedRows, getRowId]);

  // True when every row across all pages is selected.
  const isAllDataSelected = useMemo(() => {
    if (!getRowId || allData.length === 0) return false;
    return allData.every((row) => selectedRows.has(getRowId(row)));
  }, [allData, selectedRows, getRowId]);

  const isIndeterminate = useMemo(
    () => !isAllSelected && pagedData.some((row) => !!getRowId && selectedRows.has(getRowId(row))),
    [pagedData, selectedRows, getRowId, isAllSelected],
  );

  const selectionEnabled = getRowId !== undefined;

  return {
    selectedRows,
    toggleRow,
    selectAll,
    selectAllData,
    clearSelection,
    clearPage,
    isRowSelected,
    isAllSelected,
    isAllDataSelected,
    isIndeterminate,
    selectionEnabled,
  };
}
