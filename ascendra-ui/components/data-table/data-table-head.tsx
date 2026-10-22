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
  // The label sits in a flex row (beside the sort icon), so a text-right on the th alone can't move it. Right-aligned,
  // the icon goes before the label — after it, its (hover-only) space would hold the label off the column's edge,
  // out of line with the numbers under it.
  const alignRight = col?.align === 'right';

  return (
    <th
      data-slot="table-head"
      className={cn(
        'py-3 pr-5 pl-5 first:pl-6 whitespace-nowrap',
        alignRight && 'text-right',
        sortable && 'group/sort cursor-pointer select-none',
        className
      )}
      onClick={sortable ? () => handleSort(column) : undefined}
    >
      <div className={cn('flex items-center gap-1.5', alignRight && 'flex-row-reverse justify-start')}>
        {label}
        <DataTableSortIcon column={column} />
      </div>
    </th>
  );
}
