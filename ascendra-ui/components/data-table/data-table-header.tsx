'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { DataTableScrollContext } from './data-table';

export function DataTableHeader({
  sticky = false,
  className,
  ...props
}: React.ComponentProps<'thead'> & { sticky?: boolean }) {
  const { scrolled, vscroll } = React.useContext(DataTableScrollContext);
  return (
    <thead
      data-slot="table-header"
      className={cn(
        '',
        vscroll && sticky && 'sticky top-0 z-10',
        vscroll && sticky && scrolled && 'bg-muted',
        className
      )}
      {...props}
    />
  );
}
