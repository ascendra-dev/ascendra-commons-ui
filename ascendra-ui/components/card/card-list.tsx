"use client";

import * as React from "react";
import { cn } from "@/ascendra-ui/shadcn";
import { TableRowLink, rowLinkRowClasses, rowSheetIcon } from "@/ascendra-ui/components/ui/table";
import { useOverlayScrollbars } from "@/ascendra-ui/hooks/use-overlay-scrollbars";
import { useVisibleRowsHeight } from "@/ascendra-ui/hooks/use-visible-rows-height";

const CardListContext = React.createContext({ columns: false });

/**
 * A list of rows inside a CardPanel — what a one-list section (top sources, rejections by route) is, instead of a
 * table whose header row carries the title. Rows look and behave like a table's: a separator between them, the hover
 * tint, a whole-row link (CardListLink), the same padding.
 *
 * `columns` — a CSS grid template ("auto auto 1fr"); each row's children line up in those columns across the list,
 * as table cells would. Without it a row is a flex line. `visibleRows` — shows that many rows whole, then scrolls,
 * measured like Table's.
 */
export function CardList({
  columns,
  visibleRows,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & { columns?: string; visibleRows?: number }) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const maxHeight = useVisibleRowsHeight(viewportRef, visibleRows);
  useOverlayScrollbars(hostRef, viewportRef, { x: "hidden", y: "scroll", enabled: !!maxHeight });

  return (
    <CardListContext.Provider value={{ columns: !!columns }}>
      <div ref={hostRef} data-slot="card-list-frame" className="min-h-0">
        <div
          ref={viewportRef}
          // hides the native scrollbar until useOverlayScrollbars takes over
          data-overlayscrollbars-initialize={maxHeight ? "" : undefined}
          className={cn(maxHeight && "overflow-y-auto")}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <div
            role="list"
            data-slot="card-list"
            className={cn(columns && "grid", className)}
            style={columns ? { gridTemplateColumns: columns, ...style } : style}
            {...props}
          >
            {children}
          </div>
        </div>
      </div>
    </CardListContext.Provider>
  );
}

/**
 * One row — a separator below it (not the last), the table's hover tint, and room for a CardListLink. `opensSheet`:
 * the row opens a sheet (its own onClick) and ends in the panel icon.
 */
export function CardListItem({
  className,
  style,
  opensSheet,
  ...props
}: React.ComponentProps<"div"> & { opensSheet?: boolean }) {
  const { columns } = React.useContext(CardListContext);
  const sheet = rowSheetIcon(opensSheet);
  return (
    <div
      role="listitem"
      data-slot="card-list-item"
      className={cn(
        "group/row border-border px-5 py-4 text-sm transition-colors not-last:border-b hover:bg-gray-700/4",
        "first:rounded-t-lg last:rounded-b-lg",
        columns ? "col-span-full grid grid-cols-subgrid items-center gap-x-10" : "flex items-center gap-4",
        ...rowLinkRowClasses,
        sheet.className,
        className,
      )}
      style={{ ...sheet.style, ...style }}
      {...props}
    />
  );
}

/** Makes the whole row a link — a real <a>; see TableRowLink. Put it around the row's label. */
export function CardListLink(props: React.ComponentProps<typeof TableRowLink>) {
  return <TableRowLink {...props} />;
}
