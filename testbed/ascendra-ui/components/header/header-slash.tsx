import * as React from 'react';
import { LuSlash } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';

export function HeaderSlash({
  className,
  ...props
}: React.ComponentProps<typeof LuSlash>) {
  return (
    <LuSlash
      data-slot="header-slash"
      className={cn(
        'size-3 shrink-0 -rotate-12 text-gray-300 dark:text-gray-500',
        className
      )}
      {...props}
    />
  );
}
