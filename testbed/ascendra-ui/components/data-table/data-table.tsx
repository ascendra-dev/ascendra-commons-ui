'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';

export const DataTableScrollContext = React.createContext({
  scrolled: false,
  vscroll: false,
});

export function DataTable({
  scrollable = false,
  vertical = false,
  horizontal = true,
  height,
  className,
  ...props
}: React.ComponentProps<'table'> & {
  scrollable?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
  height?: number;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !vertical) return;
    const handler = () => setScrolled(el.scrollTop > 0);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [vertical]);

  return (
    <DataTableScrollContext.Provider
      value={{ scrolled, vscroll: scrollable && vertical && !!height }}
    >
      <div
        ref={ref}
        data-slot="table-wrapper"
        className={cn(
          '',
          scrollable && horizontal && '-mb-px overflow-x-auto pb-px',
          scrollable && vertical && height && 'overflow-y-auto'
        )}
        style={
          scrollable && vertical && height
            ? { maxHeight: `${height}px` }
            : undefined
        }
      >
        <table
          data-slot="table"
          className={cn('w-full border-separate border-spacing-0', className)}
          {...props}
        />
      </div>
    </DataTableScrollContext.Provider>
  );
}
