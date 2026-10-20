'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { useOverlayScrollbars } from '@/ascendra-ui/hooks/use-overlay-scrollbars';
import { tableCardFrameClasses, tableCardViewportClasses, tableClasses } from '@/ascendra-ui/components/ui/table';

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
  const hostRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const scrollX = scrollable && horizontal;
  const scrollY = scrollable && vertical && !!height;
  useOverlayScrollbars(hostRef, ref, {
    x: scrollX ? 'scroll' : 'hidden',
    y: scrollY ? 'scroll' : 'hidden',
    enabled: scrollX || scrollY,
  });

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
      <div ref={hostRef} className={tableCardFrameClasses}>
        <div
          ref={ref}
          data-slot="table-wrapper"
          // hides the native scrollbar until useOverlayScrollbars takes over
          data-overlayscrollbars-initialize={scrollX || scrollY ? '' : undefined}
          className={cn(
            tableCardViewportClasses,
            scrollX && 'overflow-x-auto',
            scrollY && 'overflow-y-auto'
          )}
          style={scrollY ? { maxHeight: `${height}px` } : undefined}
        >
          <table
            data-slot="table"
            className={cn(tableClasses, className)}
            {...props}
          />
        </div>
      </div>
    </DataTableScrollContext.Provider>
  );
}
