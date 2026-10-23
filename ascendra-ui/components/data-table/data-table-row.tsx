'use client';

import * as React from 'react';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';
import { rowLinkRowClasses, rowSheetIcon } from '@/ascendra-ui/components/ui/table';
import { orderChildrenByColumn } from './data-table-order-children';

export interface DataTableRowProps extends React.ComponentProps<'tr'> {
  /** Marks the row whose detail is open elsewhere (e.g. in a Sheet) — highlighted, and aria-current. */
  active?: boolean;
  /** The row opens a sheet (its own onClick) — it ends in the panel icon. */
  opensSheet?: boolean;
}

export function DataTableRow({ className, style, children, active, opensSheet, ...props }: DataTableRowProps) {
  const { columns } = useDataTableColumns();
  const sheet = rowSheetIcon(opensSheet);

  return (
    <tr
      data-slot="table-row"
      data-active={active || undefined}
      aria-current={active || undefined}
      className={cn(
        'group/row transition-colors hover:bg-gray-700/4 data-active:bg-primary/8 data-active:hover:bg-primary/10',
        ...rowLinkRowClasses,
        sheet.className,
        className
      )}
      style={{ ...sheet.style, ...style }}
      {...props}
    >
      {orderChildrenByColumn(columns, children)}
    </tr>
  );
}
