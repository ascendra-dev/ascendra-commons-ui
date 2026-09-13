'use client';

import * as React from 'react';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';
import { orderChildrenByColumn } from './data-table-order-children';

export function DataTableHeaderRow({ className, children, ...props }: React.ComponentProps<'tr'>) {
  const { columns } = useDataTableColumns();

  return (
    <tr
      data-slot="table-header-row"
      className={cn('text-secondary-foreground text-left text-xs', className)}
      {...props}
    >
      {orderChildrenByColumn(columns, children)}
    </tr>
  );
}
