'use client';

import * as React from 'react';

/** How far above the Nth row's bottom the viewport ends. At the top that hides only the row's separator and a little
 *  of its bottom padding; scrolled to the end, it keeps the separator of the row above the last N clear of the card's
 *  top edge — the table's last row has no separator, so it is a pixel short, and fractional row heights (zoom, device
 *  pixel ratio) round up under Math.ceil. 4 was settled by eye on the rate-limiting overview. */
const ROW_END_OFFSET = 4;

/**
 * The max height that shows a table's first `visibleRows` body rows whole, then scrolls — for `visibleRows` on Table,
 * DataTable and CardList (its rows). Rows differ in height (wrapping content), so it is measured rather than rows × a fixed height.
 *
 * `viewport` is the scroll container holding the <table>. Re-measures whenever the table resizes — rows added or
 * removed, content wrapping at a new width, a header that grows. Undefined (no cap) when `visibleRows` is unset or
 * the table has that many rows or fewer.
 */
export function useVisibleRowsHeight(
  viewport: React.RefObject<HTMLElement | null>,
  visibleRows: number | undefined
) {
  const [height, setHeight] = React.useState<number>();

  React.useLayoutEffect(() => {
    // A table's body rows, or a CardList's rows.
    const table = viewport.current?.querySelector('table');
    const list = table ? null : viewport.current?.querySelector<HTMLElement>('[data-slot="card-list"]');
    const content = table ?? list;
    if (!visibleRows || !content) {
      setHeight(undefined);
      return;
    }
    const measure = () => {
      const rows = table ? table.tBodies[0]?.rows : list!.children;
      const last = rows && rows.length > visibleRows ? rows[visibleRows - 1] : undefined;
      setHeight(
        last
          ? Math.ceil(last.getBoundingClientRect().bottom - content.getBoundingClientRect().top) - ROW_END_OFFSET
          : undefined
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [viewport, visibleRows]);

  return height;
}
