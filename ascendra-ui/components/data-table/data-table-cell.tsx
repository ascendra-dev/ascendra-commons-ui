'use client';

import * as React from 'react';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';

interface DataTableCellProps extends Omit<React.ComponentProps<'td'>, 'column'> {
  column: string;
}

export function DataTableCell({ column, className, children, ...props }: DataTableCellProps) {
  const { columns } = useDataTableColumns();
  const col = columns.find((c) => String(c.key) === column);
  if (col?.active === false) return null;

  return (
    <td
      data-slot="table-cell"
      className={cn('px-5 py-4 first:pl-6 last:pr-6', col?.align === 'right' && 'text-right', className)}
      {...props}
    >
      {children}
    </td>
  );
}
