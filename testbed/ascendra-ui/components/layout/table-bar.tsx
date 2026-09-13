'use client';

import { cn } from '@/ascendra-ui/shadcn';

export function TableBar({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="able-bar"
      className={cn(
        'flex w-full flex-col items-start justify-between gap-4 px-0.5 sm:flex-row sm:items-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
