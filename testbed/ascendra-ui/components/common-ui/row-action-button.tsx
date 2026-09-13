import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { MdOutlineMoreHoriz } from 'react-icons/md';

export function RowActionButton({
  opaque = false,
  className,
  ...props
}: React.ComponentProps<'button'> & { opaque?: boolean }) {
  return (
    <button
      type="button"
      data-slot="row-action-button"
      className={cn(
        'focus-visible:outline-primary flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2',
        'hover:bg-background hover:border',
        'data-[state=open]:bg-background data-[state=open]:border',
        'group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
        !opaque && 'opacity-0',
        className
      )}
      {...props}
    >
      <MdOutlineMoreHoriz className="size-3.5" />
    </button>
  );
}
