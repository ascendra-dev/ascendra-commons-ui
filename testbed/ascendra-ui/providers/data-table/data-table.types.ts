import type { FilterChip } from './use-filter.hook';
import type { PaginationState } from './use-pagination.hook';

export type ColumnType = 'string' | 'number' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  type?: ColumnType;
  sortable?: boolean;
  /** Column is always visible; checkbox is disabled. Implies active. */
  freeze?: boolean;
  /** Column position cannot be changed; shows lock icon instead of drag handle. */
  locked?: boolean;
  /** Whether the column is currently visible. Defaults to true. */
  active?: boolean;
  /** Whether the column appears in the filter picker. Defaults to false. */
  filter?: boolean;
  /**
   * Overrides how this column's value becomes a searchable string — used for
   * both filtering (fuzzy and plain) and for computing highlight ranges.
   * Defaults to a built-in per-`type` formatter. Set this whenever the cell
   * displays a custom-formatted string (e.g. a shared `formatDateTime`
   * helper), and return the *exact same string* the cell renders via
   * `DataTableHighlight`'s `text` prop — that's what keeps search and
   * highlighting in agreement with what's actually on screen.
   */
  /** Right-aligns the column — its header and every cell — e.g. a count, so the digits line up. Default left. */
  align?: 'left' | 'right';
  searchValue?: (value: T[keyof T], row: T) => string;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface DataTableColumnContextValue {
  columns: ColumnDef<unknown>[];
  filterableColumns: ColumnDef<unknown>[];
  toggleColumnActive: (key: string) => void;
  reorderColumns: (fromKey: string, toKey: string) => void;
  isColSortable: (key: string) => boolean;
  /** Persist current column order and visibility to localStorage.
   *  Undefined when the provider was mounted without a tableId. */
  saveColumnPreferences: (() => void) | undefined;
  /** True when the current column state differs from the last saved (or loaded) state. */
  isColumnPreferencesDirty: boolean;
}

export interface DataTableSearchContextValue {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fuzzy: boolean;
  setFuzzy: (v: boolean) => void;
  getRanges: (item: unknown, key: PropertyKey) => [number, number][] | undefined;
}

export interface DataTableFilterContextValue {
  filters: FilterChip[];
  addFilter: (key: string) => void;
  setFilterValue: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  getOptionsFor: (key: string) => string[];
}

export interface DataTableSortContextValue {
  sortConfig: SortConfig<unknown> | null;
  handleSort: (key: PropertyKey) => void;
  clearSort: () => void;
}

export interface DataTableDataContextValue {
  pagedData: unknown[];
  totalFiltered: number;
  pagination: PaginationState;
  isLoading: boolean;
  /** The provider's own getRowId prop, if it was given one. */
  getRowId?: (row: unknown) => string;
}

export interface DataTableSelectionContextValue {
  selectedRows: Set<string>;
  /** The selected rows' data, across every page of the loaded data. */
  selectedData: unknown[];
  isAllSelected: boolean;
  isAllDataSelected: boolean;
  isIndeterminate: boolean;
  isRowSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  selectAll: () => void;
  selectAllData: () => void;
  clearSelection: () => void;
  clearPage: () => void;
  selectionEnabled: boolean;
}

export interface DataTableContextValue {
  columns: ColumnDef<unknown>[];
  toggleColumnActive: (key: string) => void;
  reorderColumns: (fromKey: string, toKey: string) => void;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fuzzy: boolean;
  setFuzzy: (v: boolean) => void;
  getRanges: (item: unknown, key: PropertyKey) => [number, number][] | undefined;
  filters: FilterChip[];
  filterableColumns: ColumnDef<unknown>[];
  addFilter: (key: string) => void;
  setFilterValue: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  getOptionsFor: (key: string) => string[];
  sortConfig: SortConfig<unknown> | null;
  handleSort: (key: PropertyKey) => void;
  clearSort: () => void;
  isColSortable: (key: string) => boolean;
  pagedData: unknown[];
  totalFiltered: number;
  pagination: PaginationState;
  selectedRows: Set<string>;
  selectedData: unknown[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  isRowSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectionEnabled: boolean;
}

export interface DataTableState<T extends object> {
  columns: ColumnDef<T>[];
  toggleColumnActive: (key: string) => void;
  reorderColumns: (fromKey: string, toKey: string) => void;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fuzzy: boolean;
  setFuzzy: (v: boolean) => void;
  getRanges: (item: T, key: keyof T) => [number, number][] | undefined;
  filters: FilterChip[];
  filterableColumns: ColumnDef<T>[];
  addFilter: (key: string) => void;
  setFilterValue: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  getOptionsFor: (key: string) => string[];
  sortConfig: SortConfig<T> | null;
  handleSort: (key: keyof T) => void;
  clearSort: () => void;
  isColSortable: (key: string) => boolean;
  pagedData: T[];
  totalFiltered: number;
  pagination: PaginationState;
  selectedRows: Set<string>;
  /** The selected rows' data, across every page of the loaded data. */
  selectedData: T[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  isRowSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectionEnabled: boolean;
}

export interface DataTableProviderProps<T extends object> {
  data?: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  /** A stable unique id per row — for row selection, DataTableSheetNavigator and the active-row highlight. */
  getRowId?: (row: T) => string;
  /** Turns on row selection: the checkbox components and DataTableHeadAction's Select all / Clear all. Needs
   *  getRowId. Off by default — a getRowId given only for the sheet navigator doesn't make rows selectable. */
  selectable?: boolean;
  /** Unique key used to persist column order and visibility to localStorage.
   *  Omit to disable persistence (columns reset on page reload). */
  tableId?: string;
  children: React.ReactNode;
}
