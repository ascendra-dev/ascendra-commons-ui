'use client';

import * as React from 'react';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';

interface DataTableCellProps extends Omit<React.ComponentProps<'td'>, 'column'> {
  column: string;
}

export function DataTableCell({ column, className, children, ...props }: DataTableCellProps) {
  const { columns } = useDataTableColumns();
  if (columns.find((c) => String(c.key) === column)?.active === false) return null;

  return (
    <td
      data-slot="table-cell"
      className={cn('px-5 py-4 first:pl-6 last:pr-6', className)}
      {...props}
    >
      {children}
    </td>
  );
}
