'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useFilter } from './use-filter.hook';
import { usePagination } from './use-pagination.hook';
import { useSearch } from './use-search.hook';
import { useSelection } from './use-selection.hook';
import { useSort } from './use-sort.hook';
import { useOptionalQueryContext } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';
import { useColumnPersistence } from '@/ascendra-ui/preferences/use-column-preferences.hook';
import type {
  ColumnDef,
  SortConfig,
  DataTableContextValue,
  DataTableState,
  DataTableProviderProps,
  DataTableColumnContextValue,
  DataTableSearchContextValue,
  DataTableFilterContextValue,
  DataTableSortContextValue,
  DataTableDataContextValue,
  DataTableSelectionContextValue,
} from './data-table.types';

// --- Contexts ---

const DataTableColumnContext = createContext<DataTableColumnContextValue | null>(null);
const DataTableSearchContext = createContext<DataTableSearchContextValue | null>(null);
const DataTableFilterContext = createContext<DataTableFilterContextValue | null>(null);
const DataTableSortContext = createContext<DataTableSortContextValue | null>(null);
const DataTableDataContext = createContext<DataTableDataContextValue | null>(null);
const DataTableSelectionContext = createContext<DataTableSelectionContextValue | null>(null);

// --- Provider ---

export function DataTableProvider<T extends object>({
  data: dataProp,
  columns: initialColumns,
  isLoading: isLoadingProp,
  getRowId,
  tableId,
  children,
}: DataTableProviderProps<T>) {
  const queryCtx = useOptionalQueryContext();
  const data = dataProp ?? (queryCtx?.data as T[] | undefined) ?? [];
  const isLoading = isLoadingProp ?? queryCtx?.isLoading ?? false;

  const [columns, setColumns] = useState<ColumnDef<T>[]>(() => initialColumns);
  const { save: saveColumnPreferences, isDirty: isColumnPreferencesDirty } = useColumnPersistence<T>(tableId, columns, setColumns, initialColumns);

  const toggleColumnActive = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        String(col.key) === key ? { ...col, active: col.active === false ? true : false } : col
      )
    );
  }, []);

  const reorderColumns = useCallback((fromKey: string, toKey: string) => {
    setColumns((prev) => {
      const result = [...prev];
      const fromIdx = result.findIndex((c) => String(c.key) === fromKey);
      const toIdx = result.findIndex((c) => String(c.key) === toKey);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const [moved] = result.splice(fromIdx, 1);
      result.splice(toIdx, 0, moved);
      return result;
    });
  }, []);

  const isColSortable = useCallback(
    (key: string) => columns.find((c) => String(c.key) === key)?.sortable !== false,
    [columns]
  );

  const filterableColumns = useMemo(
    () => columns.filter((col) => col.filter === true),
    [columns]
  );

  const {
    searchTerm,
    setSearchTerm,
    fuzzy,
    setFuzzy,
    getRanges,
    filteredData: searchedData,
  } = useSearch(data, columns);

  const {
    filters,
    addFilter,
    setFilterValue,
    removeFilter,
    clearFilters,
    getOptionsFor,
    filteredData,
  } = useFilter(searchedData);

  const { sortConfig, handleSort, clearSort, sortedData } = useSort(filteredData, columns);

  const { pagination, paginatedData: pagedData } = usePagination(sortedData);

  const {
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
  } = useSelection(pagedData, sortedData, getRowId);

  // Clear stale selections whenever the search/filter query changes.
  // filteredData identity only changes on search or filter updates, not on sort or page navigation.
  useEffect(() => {
    clearSelection();
  }, [filteredData, clearSelection]);

  // --- Context values (each only changes when its own slice changes) ---

  const columnCtx = useMemo<DataTableColumnContextValue>(
    () => ({
      columns: columns as unknown as ColumnDef<unknown>[],
      filterableColumns: filterableColumns as unknown as ColumnDef<unknown>[],
      toggleColumnActive,
      reorderColumns,
      isColSortable,
      saveColumnPreferences: tableId ? saveColumnPreferences : undefined,
      isColumnPreferencesDirty,
    }),
    [columns, filterableColumns, toggleColumnActive, reorderColumns, isColSortable, tableId, saveColumnPreferences, isColumnPreferencesDirty]
  );

  const searchCtx = useMemo<DataTableSearchContextValue>(
    () => ({
      searchTerm,
      setSearchTerm,
      fuzzy,
      setFuzzy,
      getRanges: getRanges as unknown as DataTableSearchContextValue['getRanges'],
    }),
    [searchTerm, setSearchTerm, fuzzy, setFuzzy, getRanges]
  );

  const filterCtx = useMemo<DataTableFilterContextValue>(
    () => ({ filters, addFilter, setFilterValue, removeFilter, clearFilters, getOptionsFor }),
    [filters, addFilter, setFilterValue, removeFilter, clearFilters, getOptionsFor]
  );

  const sortCtx = useMemo<DataTableSortContextValue>(
    () => ({
      sortConfig: sortConfig as unknown as SortConfig<unknown> | null,
      handleSort: handleSort as unknown as DataTableSortContextValue['handleSort'],
      clearSort,
    }),
    [sortConfig, handleSort, clearSort]
  );

  const dataCtx = useMemo<DataTableDataContextValue>(
    () => ({ pagedData: pagedData as unknown[], totalFiltered: sortedData.length, pagination, isLoading }),
    [pagedData, sortedData.length, pagination, isLoading]
  );

  const selectionCtx = useMemo<DataTableSelectionContextValue>(
    () => ({ selectedRows, isAllSelected, isAllDataSelected, isIndeterminate, isRowSelected, toggleRow, selectAll, selectAllData, clearSelection, clearPage, selectionEnabled }),
    [selectedRows, isAllSelected, isAllDataSelected, isIndeterminate, isRowSelected, toggleRow, selectAll, selectAllData, clearSelection, clearPage, selectionEnabled]
  );

  return (
    <DataTableColumnContext.Provider value={columnCtx}>
      <DataTableSearchContext.Provider value={searchCtx}>
        <DataTableFilterContext.Provider value={filterCtx}>
          <DataTableSortContext.Provider value={sortCtx}>
            <DataTableDataContext.Provider value={dataCtx}>
              <DataTableSelectionContext.Provider value={selectionCtx}>
                {children}
              </DataTableSelectionContext.Provider>
            </DataTableDataContext.Provider>
          </DataTableSortContext.Provider>
        </DataTableFilterContext.Provider>
      </DataTableSearchContext.Provider>
    </DataTableColumnContext.Provider>
  );
}

// --- Specific hooks (subscribe only to the slice you need) ---

export function useDataTableColumns(): DataTableColumnContextValue {
  const ctx = useContext(DataTableColumnContext);
  if (!ctx) throw new Error('useDataTableColumns must be used within DataTableProvider');
  return ctx;
}

export function useDataTableSearch(): DataTableSearchContextValue {
  const ctx = useContext(DataTableSearchContext);
  if (!ctx) throw new Error('useDataTableSearch must be used within DataTableProvider');
  return ctx;
}

export function useDataTableFilter(): DataTableFilterContextValue {
  const ctx = useContext(DataTableFilterContext);
  if (!ctx) throw new Error('useDataTableFilter must be used within DataTableProvider');
  return ctx;
}

export function useDataTableSort(): DataTableSortContextValue {
  const ctx = useContext(DataTableSortContext);
  if (!ctx) throw new Error('useDataTableSort must be used within DataTableProvider');
  return ctx;
}

export function useDataTableData(): DataTableDataContextValue {
  const ctx = useContext(DataTableDataContext);
  if (!ctx) throw new Error('useDataTableData must be used within DataTableProvider');
  return ctx;
}

export function useDataTableSelection(): DataTableSelectionContextValue {
  const ctx = useContext(DataTableSelectionContext);
  if (!ctx) throw new Error('useDataTableSelection must be used within DataTableProvider');
  return ctx;
}

// --- Merged hooks (backward compat — re-renders on any slice change) ---

export function useDataTableContext(): DataTableContextValue {
  const col = useContext(DataTableColumnContext);
  const search = useContext(DataTableSearchContext);
  const filter = useContext(DataTableFilterContext);
  const sort = useContext(DataTableSortContext);
  const data = useContext(DataTableDataContext);
  const selection = useContext(DataTableSelectionContext);
  if (!col || !search || !filter || !sort || !data || !selection)
    throw new Error('useDataTableContext must be used within DataTableProvider');
  return { ...col, ...search, ...filter, ...sort, ...data, ...selection };
}

// For page-level consumers that know T (e.g. useDataTable<Invoice>())
export function useDataTable<T extends object>(): DataTableState<T> {
  return useDataTableContext() as unknown as DataTableState<T>;
}
