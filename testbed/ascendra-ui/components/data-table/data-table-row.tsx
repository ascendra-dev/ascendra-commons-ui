'use client';

import * as React from 'react';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';
import { orderChildrenByColumn } from './data-table-order-children';

export interface DataTableRowProps extends React.ComponentProps<'tr'> {
  /** Marks the row whose detail is open elsewhere (e.g. in a Sheet) — highlighted, and aria-current. */
  active?: boolean;
}

export function DataTableRow({ className, children, active, ...props }: DataTableRowProps) {
  const { columns } = useDataTableColumns();

  return (
    <tr
      data-slot="table-row"
      data-active={active || undefined}
      aria-current={active || undefined}
      className={cn(
        'group/row transition-colors [clip-path:inset(0_4px)] first:[clip-path:inset(0_4px_0_4px_round_8px_8px_0_0)] last:[clip-path:inset(0_4px_0_4px_round_0_0_8px_8px)] first:last:[clip-path:inset(0_4px_round_8px)] hover:bg-gray-700/4 data-active:bg-primary/8 data-active:hover:bg-primary/10',
        className
      )}
      {...props}
    >
      {orderChildrenByColumn(columns, children)}
    </tr>
  );
}
