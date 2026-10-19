import * as React from 'react';

import { cn } from '@/ascendra-ui/shadcn';
import { OverlayScroll } from '@/ascendra-ui/components/ui/overlay-scroll';

/**
 * A light table for short, read-only lists inside a sheet, card or panel — one border, a muted header strip and
 * divider lines between rows. No provider, sorting or paging: reach for Table / DataTable when you need those.
 * Real table elements underneath, so columns size to their content.
 */
function SimpleTable({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <OverlayScroll x="scroll" y="hidden" data-slot="simple-table" className="w-full rounded-lg border">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </OverlayScroll>
  );
}

/** The header strip — its children are SimpleTableHead cells (it renders the row itself). */
function SimpleTableHeader({ className, children, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead data-slot="simple-table-header" className={cn('bg-muted/50 border-b', className)} {...props}>
      <tr>{children}</tr>
    </thead>
  );
}

function SimpleTableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="simple-table-head"
      className={cn(
        'text-muted-foreground px-4 py-2 text-left text-xs font-semibold tracking-wider whitespace-nowrap uppercase',
        className,
      )}
      {...props}
    />
  );
}

function SimpleTableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="simple-table-body" className={cn('divide-y', className)} {...props} />;
}

function SimpleTableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr data-slot="simple-table-row" className={className} {...props} />;
}

function SimpleTableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td data-slot="simple-table-cell" className={cn('px-4 py-2.5 align-middle', className)} {...props} />;
}

export { SimpleTable, SimpleTableBody, SimpleTableCell, SimpleTableHead, SimpleTableHeader, SimpleTableRow };
