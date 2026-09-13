'use client';

import * as React from 'react';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';
import { orderChildrenByColumn } from './data-table-order-children';

export function DataTableRow({ className, children, ...props }: React.ComponentProps<'tr'>) {
  const { columns } = useDataTableColumns();

  return (
    <tr
      data-slot="table-row"
      className={cn(
        'group/row transition-colors [clip-path:inset(0_4px)] first:[clip-path:inset(0_4px_0_4px_round_8px_8px_0_0)] last:[clip-path:inset(0_4px_0_4px_round_0_0_8px_8px)] first:last:[clip-path:inset(0_4px_round_8px)] hover:bg-gray-700/4',
        className
      )}
      {...props}
    >
      {orderChildrenByColumn(columns, children)}
    </tr>
  );
}
