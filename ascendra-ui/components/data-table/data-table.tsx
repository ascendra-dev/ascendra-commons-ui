'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { useOverlayScrollbars } from '@/ascendra-ui/hooks/use-overlay-scrollbars';
import { useVisibleRowsHeight } from '@/ascendra-ui/hooks/use-visible-rows-height';
import {
  tableCardFillFrameClasses,
  tableCardFillViewportClasses,
  tableCardFrameClasses,
  tableCardViewportClasses,
  tableClasses,
} from '@/ascendra-ui/components/ui/table';
import { usePageFillTable } from '@/ascendra-ui/components/layout/page-focus';

export const DataTableScrollContext = React.createContext({
  scrolled: false,
  vscroll: false,
});

export function DataTable({
  scrollable = false,
  vertical = false,
  horizontal = true,
  height,
  visibleRows,
  className,
  ...props
}: React.ComponentProps<'table'> & {
  /** With `vertical` and `height`: the rows scroll in that height. */
  scrollable?: boolean;
  vertical?: boolean;
  /** Columns wider than the card scroll sideways — on by default, so a table never cuts its columns off on a narrow
   *  screen (it needs no `scrollable`); false clips them. */
  horizontal?: boolean;
  height?: number;
  /** Shows this many body rows whole, then scrolls vertically — measured, so rows of any height fit. Needs no
   *  scrollable/vertical, and takes over from height. No cap while the table has this many rows or fewer. */
  visibleRows?: number;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const rowsHeight = useVisibleRowsHeight(ref, visibleRows);
  // In a focused page it takes the rest of the height and its rows scroll (header sticky, footer below) — see PageFocus.
  const fill = usePageFillTable();
  const maxHeight = fill ? undefined : visibleRows ? rowsHeight : scrollable && vertical ? height : undefined;
  const scrollX = horizontal;
  const scrollY = !!maxHeight || fill;
  useOverlayScrollbars(hostRef, ref, {
    x: scrollX ? 'scroll' : 'hidden',
    y: scrollY ? 'scroll' : 'hidden',
    enabled: scrollX || scrollY,
  });

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !scrollY) return;
    const handler = () => setScrolled(el.scrollTop > 0);
    handler();
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [scrollY]);

  return (
    <DataTableScrollContext.Provider
      value={{ scrolled, vscroll: scrollY }}
    >
      <div ref={hostRef} data-slot="data-table-frame" className={cn(tableCardFrameClasses, fill && tableCardFillFrameClasses)}>
        <div
          ref={ref}
          data-slot="table-wrapper"
          // hides the native scrollbar until useOverlayScrollbars takes over
          data-overlayscrollbars-initialize={scrollX || scrollY ? '' : undefined}
          className={cn(
            tableCardViewportClasses,
            fill && tableCardFillViewportClasses,
            scrollX && 'overflow-x-auto',
            scrollY && 'overflow-y-auto'
          )}
          style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
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
