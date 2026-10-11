'use client';

import { SheetNavigator, type SheetNavigatorProps } from '@/ascendra-ui/components/ui/sheet-navigator';
import { useDataTableData } from '@/ascendra-ui/providers/data-table/data-table.provider';

export interface DataTableSheetNavigatorProps<T>
  extends Omit<SheetNavigatorProps, 'index' | 'count' | 'onIndexChange' | 'onSelect'> {
  /** Id (per the provider's getRowId) of the row the sheet is showing. */
  selectedId: string;
  onSelect: (row: T) => void;
}

/**
 * SheetNavigator over the rows the table is currently showing — the loaded batch with search,
 * filters and sort applied. Stops at the page's first and last row. Renders nothing once the
 * selected row is no longer on the page. Must render inside the table's provider, which needs getRowId.
 */
export function DataTableSheetNavigator<T>({ selectedId, onSelect, ...props }: DataTableSheetNavigatorProps<T>) {
  const { pagedData, getRowId } = useDataTableData();
  if (!getRowId) throw new Error('DataTableSheetNavigator needs getRowId on the DataTable provider');

  const rows = pagedData as T[];
  const index = rows.findIndex((row) => getRowId(row) === selectedId);
  if (index === -1) return null;

  return <SheetNavigator index={index} count={rows.length} onIndexChange={(i) => onSelect(rows[i])} {...props} />;
}
