'use client';

import { DataTableQueryProvider } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';
import { DataTableProvider } from '@/ascendra-ui/providers/data-table/data-table.provider';
import type { QueryDef, QueryFunctionMap, FieldOptionsMap } from '@/ascendra-ui/providers/data-table-query/data-table-query.types';
import type { ColumnDef } from '@/ascendra-ui/providers/data-table/data-table.types';

export interface DataTableWithQueryProviderProps<T extends object> {
  queries: QueryDef[];
  queryFunctions: QueryFunctionMap<T>;
  fieldOptions?: FieldOptionsMap;
  columns: ColumnDef<T>[];
  data?: T[];
  isLoading?: boolean;
  getRowId?: (row: T) => string;
  /** Unique key used to persist column order and visibility to localStorage.
   *  Omit to disable persistence (columns reset on page reload). */
  tableId?: string;
  /** Prefix of the URL params that trigger a query on load: `?q=<queryId>&q.<field>=<value>`. Default `'q'`.
   *  Give each table on a page its own key. */
  urlKey?: string;
  children: React.ReactNode;
}

export function DataTableWithQueryProvider<T extends object>({
  queries,
  queryFunctions,
  fieldOptions,
  columns,
  data,
  isLoading,
  getRowId,
  tableId,
  urlKey,
  children,
}: DataTableWithQueryProviderProps<T>) {
  return (
    <DataTableQueryProvider
      queries={queries}
      queryFunctions={queryFunctions}
      fieldOptions={fieldOptions}
      tableId={tableId}
      urlKey={urlKey}
    >
      <DataTableProvider columns={columns} data={data} isLoading={isLoading} getRowId={getRowId} tableId={tableId}>
        {children}
      </DataTableProvider>
    </DataTableQueryProvider>
  );
}
