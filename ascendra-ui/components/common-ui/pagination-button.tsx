import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';

export function PaginationButton({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      data-slot="pagination-button"
      className={cn(
        'bg-background focus-visible:outline-primary border-border flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
