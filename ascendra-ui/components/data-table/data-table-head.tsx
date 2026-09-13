'use client';

import * as React from 'react';
import { useDataTableColumns, useDataTableSort } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';
import { DataTableSortIcon } from './data-table-sort-icon';

interface DataTableHeadProps {
  column: string;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableHead({ column, children, className }: DataTableHeadProps) {
  const { columns, isColSortable } = useDataTableColumns();
  const { handleSort } = useDataTableSort();
  const col = columns.find((c) => String(c.key) === column);
  if (col?.active === false) return null;
  const sortable = isColSortable(column);
  const label = children ?? col?.label;

  return (
    <th
      data-slot="table-head"
      className={cn(
        'py-3 pr-5 pl-5 first:pl-6',
        sortable && 'group/sort cursor-pointer select-none',
        className
      )}
      onClick={sortable ? () => handleSort(column) : undefined}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <DataTableSortIcon column={column} />
      </div>
    </th>
  );
}
