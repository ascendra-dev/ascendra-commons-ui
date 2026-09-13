import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { LucideChevronsUpDown } from 'lucide-react';

type IconType = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

export function HeaderChevron({
  icon: Icon = LucideChevronsUpDown,
  className,
  ...props
}: React.ComponentProps<'button'> & { icon?: IconType }) {
  return (
    <button
      type="button"
      data-slot="header-chevron"
      className={cn(
        'hover:bg-background focus-visible:outline-primary flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent transition-colors hover:border focus-visible:outline-2 focus-visible:-outline-offset-2',
        className
      )}
      {...props}
    >
      <Icon className="size-3.5 text-gray-500" />
    </button>
  );
}
