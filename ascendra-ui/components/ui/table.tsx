"use client";

import * as React from "react";
import Link from "next/link";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ascendra-ui/components/ui/select";

import { PaginationButton } from "@/ascendra-ui/components/common-ui/pagination-button";
import { cn, Separator } from "@/ascendra-ui/shadcn";
import { useOverlayScrollbars } from "@/ascendra-ui/hooks/use-overlay-scrollbars";
import { useVisibleRowsHeight } from "@/ascendra-ui/hooks/use-visible-rows-height";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { flashElement, useMaximizeScope } from "@/ascendra-ui/components/ui/maximize";
import { type PaginationState } from "@/ascendra-ui/providers/data-table/use-pagination.hook";
import {
  buildBorderClasses,
  buildBorderAfterClasses,
  buildBgBeforeClasses,
  type BorderConfig,
  type BgConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import {
  LuArrowUpRight,
  LuChevronFirst,
  LuChevronLast,
  LuChevronLeft,
  LuChevronRight,
  LuLoaderCircle,
} from "react-icons/lu";

export type ColVisibility = { key: PropertyKey; active?: boolean };

export type BatchState = {
  currentBatch: number;
  totalBatches: number | null;
  goNextBatch: () => void;
  goPrevBatch: () => void;
  /** Disables both batch nav buttons while true — during a run's first load totalBatches is still null, which would otherwise leave goNextBatch's bound unenforced. */
  isLoading?: boolean;
  /** The button whose batch is loading after a next/back step — it shows a spinner, and both buttons are disabled. */
  loading?: "next" | "prev" | null;
  /** False when totalBatches is only a lower-bound estimate (cursor-walked) — the label then shows just the current batch. Defaults to true. */
  totalBatchesExact?: boolean;
};

function filterChildrenByColumns(
  columns: ColVisibility[],
  children: React.ReactNode,
): React.ReactElement[] {
  const activeKeys = columns
    .filter((col) => col.active !== false)
    .map((col) => String(col.key));
  const childMap = new Map<string, React.ReactElement>();
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const colKey = (child.props as { colKey?: string }).colKey;
      if (colKey) childMap.set(colKey, child);
    }
  });
  return activeKeys
    .map((key) => childMap.get(key))
    .filter((c): c is React.ReactElement => c !== undefined);
}

/** The body card's ring and shadow, drawn on the non-scrolling host so all four edges stay put while the rows
 *  scroll. Starts under the header row — at --table-head-h, which TableHeader measures onto the host; 40px (the
 *  default header row's fixed h-10) when nothing sets it, e.g. under DataTable's own header — and ends 1px above the host's bottom, so the scrollbar
 *  library's overflow clip on the host keeps the bottom ring (the 1px comes from tableClasses' mb-px, taken back by
 *  the host's -mb-px). The layer-coloured spread under the ring covers whatever scrolls into the rounded corners;
 *  the clip-path trims it to 4px around the card, rounded like the layer's own corners (card radius + 4px) — square,
 *  it filled the layer's rounded corners when the card sat at the layer's bottom. Drawn only with a body. */
export const tableCardFrameClasses = cn(
  "relative -mb-px",
  "has-[tbody]:after:pointer-events-none has-[tbody]:after:absolute has-[tbody]:after:inset-x-1 has-[tbody]:after:top-[var(--table-head-h,2.5rem)] has-[tbody]:after:bottom-px has-[tbody]:after:z-2 has-[tbody]:after:rounded-lg has-[tbody]:after:[clip-path:inset(-4px_round_calc(var(--radius-lg)+4px))]",
  "has-[tbody]:after:ring-1 has-[tbody]:after:ring-(--color-umbra)/4 dark:has-[tbody]:after:ring-black/20",
  "has-[tbody]:after:shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08),0_0_0_var(--radius-lg)_var(--muted)]",
  // The vertical scrollbar runs beside the rows only, not the sticky header. Important: the library's stylesheet
  // is unlayered, so it beats any Tailwind utility.
  "[&>.os-scrollbar-vertical]:top-[var(--table-head-h,2.5rem)]!",
);

/** Clips the scroll viewport at the card's sides, so scrolled cells never slide out over the layer. Overscroll stays
 *  default on purpose: there's no CSS for "chain to the page but don't bounce" — overscroll-y-none froze the page
 *  under every table (a horizontal-only scroller is a vertical scroll container too), and overscroll-x-none didn't
 *  stop Safari's back/forward swipe. So a capped-height table's sticky header moves with the macOS bounce. */
export const tableCardViewportClasses =
  "relative z-1 [clip-path:inset(0_4px_round_var(--radius-lg))]";

/** The <table> itself — the mb-px is the room under the card for its bottom ring, see tableCardFrameClasses. */
export const tableClasses = "mb-px w-full border-separate border-spacing-0";

const TableScrollContext = React.createContext({
  scrolled: false,
  vscroll: false,
});

function TableWrapper({
  border,
  className,
  ...props
}: React.ComponentProps<"div"> & { border?: BorderConfig }) {
  return (
    <div
      data-slot="table-wrapper"
      className={cn(
        "bg-muted flex flex-col rounded-xl py-1",
        border && buildBorderClasses(border),
        className,
      )}
      {...props}
    />
  );
}

function Table({
  scrollable = false,
  vertical = false,
  horizontal = true,
  height,
  minHeight,
  visibleRows,
  className,
  ...props
}: React.ComponentProps<"table"> & {
  scrollable?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
  height?: number;
  minHeight?: number;
  /** Shows this many body rows whole, then scrolls vertically — measured, so rows of any height fit. Needs no
   *  scrollable/vertical, and takes over from height. No cap while the table has this many rows or fewer. */
  visibleRows?: number;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  // In a maximized card it shows every row — the card body scrolls instead.
  const { maximized } = useCardContext();
  const rowCap = maximized ? undefined : visibleRows;
  const rowsHeight = useVisibleRowsHeight(ref, rowCap);
  const maxHeight = rowCap ? rowsHeight : scrollable && vertical && !maximized ? height : undefined;
  const scrollX = scrollable && horizontal;
  const scrollY = !!maxHeight;
  useOverlayScrollbars(hostRef, ref, {
    x: scrollX ? "scroll" : "hidden",
    y: scrollY ? "scroll" : "hidden",
    enabled: scrollX || scrollY,
  });

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !scrollY) return;
    const handler = () => setScrolled(el.scrollTop > 0);
    handler();
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [scrollY]);

  const wrapperStyle: React.CSSProperties = {};
  if (maxHeight) wrapperStyle.maxHeight = `${maxHeight}px`;
  if (minHeight) wrapperStyle.minHeight = `${minHeight}px`;

  return (
    <TableScrollContext.Provider value={{ scrolled, vscroll: scrollY }}>
      <div ref={hostRef} data-slot="table-frame" className={tableCardFrameClasses}>
        <div
          ref={ref}
          data-slot="table-container"
          // hides the native scrollbar until useOverlayScrollbars takes over
          data-overlayscrollbars-initialize={scrollX || scrollY ? "" : undefined}
          className={cn(
            tableCardViewportClasses,
            scrollX && "overflow-x-auto",
            scrollY && "overflow-y-auto",
          )}
          style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
        >
          <table
            data-slot="table"
            className={cn(tableClasses, className)}
            {...props}
          />
        </div>
      </div>
    </TableScrollContext.Provider>
  );
}

function TableHeader({
  sticky = true,
  className,
  ref,
  ...props
}: React.ComponentProps<"thead"> & { sticky?: boolean }) {
  const { scrolled, vscroll } = React.useContext(TableScrollContext);
  const headerRef = React.useRef<HTMLTableSectionElement>(null);
  React.useImperativeHandle(ref, () => headerRef.current!);

  // The card frame starts under the header — hand it the header's real height, so a row whose content outgrows
  // the default 40px doesn't sit under the body card's ring.
  React.useLayoutEffect(() => {
    const el = headerRef.current;
    const frame = el?.closest<HTMLElement>('[data-slot="table-frame"]');
    if (!el || !frame) return;
    const measure = () =>
      frame.style.setProperty("--table-head-h", `${el.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      frame.style.removeProperty("--table-head-h");
    };
  }, []);

  return (
    <thead
      ref={headerRef}
      data-slot="table-header"
      className={cn(
        "",
        vscroll && sticky && "sticky top-0 z-10",
        vscroll && sticky && scrolled && "bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/** A fixed 40px row of column labels. A table's title goes in its card's header (Card + CardTable), not here. */
function TableHeaderRow({
  columns,
  className,
  children,
  ...props
}: React.ComponentProps<"tr"> & {
  columns?: ColVisibility[];
}) {
  const content = columns
    ? filterChildrenByColumns(columns, children)
    : children;
  return (
    <tr
      data-slot="table-header-row"
      className={cn(
        "text-secondary-foreground text-left text-xs h-10 [&>th]:py-0",
        className,
      )}
      {...props}
    >
      {content}
    </tr>
  );
}

function TableBody({
  border,
  bg,
  className,
  ref,
  ...props
}: React.ComponentProps<"tbody"> & { border?: BorderConfig; bg?: BgConfig }) {
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  React.useImperativeHandle(ref, () => bodyRef.current!);

  // Safari resolves the card's `bottom: 0` against the whole table (header included), so the card ran past
  // the last row and the scroll wrapper clipped its bottom edge and shadow. Size it to the body's own height.
  React.useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      el.style.setProperty("--body-h", `${el.getBoundingClientRect().height}px`);
      el.setAttribute("data-measured", "");
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <tbody
      ref={bodyRef}
      data-slot="table-body"
      className={cn(
        "relative isolate transform-[translate(0)]",
        !bg && "before:bg-background",
        "before:absolute before:inset-0 before:-z-10 before:mx-1 before:rounded-lg",
        "data-measured:before:bottom-auto data-measured:before:h-(--body-h)",
        "[&>tr:not(:last-child)>td]:border-border [&>tr:not(:last-child)>td]:border-b",
        // The accent border sits on ::after, over the rows — on ::before (with the background) the row separators
        // were drawn across a side stripe.
        border && "after:pointer-events-none after:absolute after:inset-0 after:mx-1 after:rounded-lg",
        border && "data-measured:after:bottom-auto data-measured:after:h-(--body-h)",
        border && buildBorderAfterClasses(border),
        bg && buildBgBeforeClasses(bg),
        className,
      )}
      {...props}
    />
  );
}

function EmptyBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-empty-body"
      className={cn(
        "relative isolate transform-[translate(0)]",
        "before:bg-background before:absolute before:inset-0 before:-z-10 before:mx-1 before:rounded-lg",
        "before:ring-1 before:ring-(--color-umbra)/4 dark:before:ring-black/20",
        "before:shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08)]",
        "dark:before:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.01),0_1px_3px_0_rgba(0,0,0,2),0_0_3px_0_rgba(0,0,0,0.2)",
        "[&>tr:not(:last-child)>td]:border-border [&>tr:not(:last-child)>td]:border-b",
        // Inside a CardPanel (a CardList's loading/empty/error state): the panel is already the raised card.
        "in-data-[slot=card-panel]:before:hidden",
        className,
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A row holding a TableRowLink: the link's overlay is placed against the row, and the row's own controls (buttons,
 * checkboxes, other links, tooltip triggers — and a selection cell as a whole) sit above it (z-2 over its z-1) so they
 * still take their clicks and hovers. Every row component (TableRow, DataTableRow) carries these — a row without
 * them lets each link's overlay cover the whole table, so the last row takes every click. Written out in full, not
 * interpolated — Tailwind only generates classes it finds as literal text.
 */
const rowLinkRowClasses = [
  "has-data-[slot=table-row-link]:relative",
  "has-data-[slot=row-end-icon]:relative",
  "has-data-[slot=table-row-link]:[&_:is(button:not([data-slot=table-row-link]),input,select,textarea,[role=button],[role=checkbox],a:not([data-slot=table-row-link]),[data-slot=tooltip-trigger],[data-slot=with-tooltip],[data-slot=table-checkbox-cell])]:relative",
  "has-data-[slot=table-row-link]:[&_:is(button:not([data-slot=table-row-link]),input,select,textarea,[role=button],[role=checkbox],a:not([data-slot=table-row-link]),[data-slot=tooltip-trigger],[data-slot=with-tooltip],[data-slot=table-checkbox-cell])]:z-2",
];

/** Lucide's panel-right, as a mask — the same icon RowEndIcon draws for a sheet, drawn by the row itself. */
const SHEET_ICON_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Cpath d='M15 3v18'/%3E%3C/svg%3E\")";

/**
 * `opensSheet` on a row (TableRow, DataTableRow, CardListItem): the row opens a sheet with its own `onClick`, and
 * ends in the panel icon — drawn on the row's ::after, so it needs no cell and survives hidden or reordered columns.
 * Same place, size and reveal as a linked row's chevron.
 */
function rowSheetIcon(opensSheet: boolean | undefined) {
  if (!opensSheet) return { className: undefined, style: undefined };
  return {
    className: cn(
      "relative",
      "after:pointer-events-none after:absolute after:top-1/2 after:right-1.5 after:z-2 after:size-3 after:-translate-y-1/2 after:content-['']",
      "after:bg-muted-foreground after:[mask:var(--row-sheet-icon)_center/contain_no-repeat]",
      "after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-within:after:opacity-100 pointer-coarse:after:opacity-100",
      // In focus mode (a focused page, a maximized card) the hand cursor alone says it opens a sheet — no icon.
      "in-[[data-slot=page-focus][data-focused]]:cursor-pointer in-[[data-slot=card][data-maximized]]:cursor-pointer",
      "in-[[data-slot=page-focus][data-focused]]:after:hidden in-[[data-slot=card][data-maximized]]:after:hidden",
    ),
    style: { "--row-sheet-icon": SHEET_ICON_MASK } as React.CSSProperties,
  };
}

function TableRow({
  columns,
  opensSheet,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"tr"> & { columns?: ColVisibility[]; opensSheet?: boolean }) {
  const sheet = rowSheetIcon(opensSheet);
  const content = columns
    ? filterChildrenByColumns(columns, children)
    : children;
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group/row transition-colors hover:bg-gray-700/4",
        ...rowLinkRowClasses,
        sheet.className,
        className,
      )}
      style={{ ...sheet.style, ...style }}
      {...props}
    >
      {content}
    </tr>
  );
}

/**
 * Where a row goes, at its right end — a chevron for a page, an arrow out for another site (a sheet's panel: see
 * rowSheetIcon; none in focus mode) — so
 * it can be told before the click. In the row's right padding (it pushes no column), shown on hover or keyboard focus,
 * and always on a touch screen. Positioned against the row (which every row component makes `relative` for it).
 */
function RowEndIcon({ kind }: { kind: "page" | "external" }) {
  const Icon = kind === "external" ? LuArrowUpRight : LuChevronRight;
  return (
    <span
      data-slot="row-end-icon"
      aria-hidden
      className={cn(
        "text-muted-foreground pointer-events-none absolute top-1/2 right-1.5 z-2 flex -translate-y-1/2 items-center",
        "opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100",
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

/**
 * Makes the whole row a link to `href` — a real `<a>`, so the browser shows where it goes, and cmd/middle-click,
 * "copy link" and Tab focus work. Put it in one cell (usually the first, around that cell's label); its overlay
 * stretches over every cell of the row. One per row: a cell that goes somewhere else uses an ordinary link, which
 * sits above the overlay. A row that opens a sheet keeps its `onClick` and takes `opensSheet` instead.
 * The row ends in a chevron (an arrow out with `external`).
 *
 * In a maximized card or focused page (which are for reading) a page link doesn't leave: the row becomes a button —
 * no icon, the ordinary cursor — that brings it back, then scrolls to the row, tints it and focuses its link — the next click goes there, in context. An `external`
 * link still opens its new tab.
 */
function TableRowLink({
  className,
  children,
  external = false,
  ...props
}: React.ComponentProps<typeof Link> & { external?: boolean }) {
  const { maximized, restore } = useMaximizeScope();
  const linkClasses = cn(
    // z-1: above the row's positioned content (a SimpleBadge is `relative`), which would otherwise paint over it.
    "outline-none after:absolute after:inset-0 after:z-1 after:content-['']",
    "focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring",
    className,
  );

  if (maximized && !external) {
    return (
      <button
        type="button"
        data-slot="table-row-link"
        className={cn("cursor-default text-left", linkClasses)}
        onClick={(event) => {
          const row = event.currentTarget.closest("tr, [role=listitem]");
          restore(() => {
            if (!row) return;
            row.scrollIntoView({ block: "nearest", behavior: "smooth" });
            flashElement(row);
            row.querySelector<HTMLElement>("[data-slot=table-row-link]")?.focus({ preventScroll: true });
          });
        }}
      >
        {children}
        <span className="sr-only"> — restores the view; then open it</span>
      </button>
    );
  }

  return (
    <Link
      data-slot="table-row-link"
      className={linkClasses}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      <RowEndIcon kind={external ? "external" : "page"} />
    </Link>
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("py-3 pr-5 pl-5 first:pl-6 whitespace-nowrap", className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-5 py-4 first:pl-6 last:pr-6", className)}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

function TableFoot({
  className,
  pagination,
  batch,
  ...props
}: React.ComponentProps<"footer"> & {
  pagination?: PaginationState;
  batch?: BatchState;
}) {
  const atFirst = !pagination || pagination.currentPage === 1;
  const atLast =
    !pagination || pagination.currentPage === pagination.totalPages;

  const rangeStart = pagination ? pagination.startIndex + 1 : 1;
  const rangeEnd = pagination ? pagination.endIndex : 1;
  const total = pagination ? pagination.totalItems : 1;
  const pageLabel = pagination
    ? `${pagination.currentPage}/${pagination.totalPages}`
    : "1/1";

  const batchBusy = !!batch?.isLoading || !!batch?.loading;
  const atFirstBatch = !batch || batch.currentBatch <= 1 || batchBusy;
  const atLastBatch =
    !batch ||
    batchBusy ||
    (batch.totalBatches !== null && batch.currentBatch >= batch.totalBatches);
  const batchLabel = batch
    ? batch.totalBatches !== null && batch.totalBatchesExact !== false
      ? `${batch.currentBatch} / ${batch.totalBatches}`
      : `${batch.currentBatch}`
    : "";
  const spinner = <LuLoaderCircle className="animate-spin" />;
  const prevBatchIcon = batch?.loading === "prev" ? spinner : <LuChevronLeft />;
  const nextBatchIcon = batch?.loading === "next" ? spinner : <LuChevronRight />;

  return (
    <footer
      data-slot="table-foot"
      className={cn(
        "text-muted-foreground flex flex-col text-xs sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="mx-1 px-5 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <span>
              {rangeStart}–{rangeEnd}
            </span>
            <span>of</span>
            <span>{total}</span>
          </div>
          {batch && (
            <div className="flex items-center">
              <Separator
                orientation="vertical"
                className="mx-3 hidden sm:block"
              />
              <div className="flex items-center gap-1">
                <PaginationButton
                  disabled={atFirstBatch}
                  className="border-0 bg-transparent disabled:opacity-40"
                  onClick={batch.goPrevBatch}
                  aria-busy={batch.loading === "prev"}
                >
                  {prevBatchIcon}
                </PaginationButton>
                <span>{batchLabel}</span>
                <PaginationButton
                  disabled={atLastBatch}
                  className="border-0 bg-transparent disabled:opacity-40"
                  onClick={batch.goNextBatch}
                  aria-busy={batch.loading === "next"}
                >
                  {nextBatchIcon}
                </PaginationButton>
              </div>
            </div>
          )}
          <div className="flex items-center">
            <Separator
              orientation="vertical"
              className="mx-3 hidden sm:block"
            />
            <span className="sm:hidden">Show</span>
            <span className="hidden sm:block">Results per page</span>
            <Select
              value={pagination ? String(pagination.pageSize) : "10"}
              onValueChange={(v) => pagination?.setPageSize(Number(v))}
            >
              <SelectTrigger className="ml-2" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom">
                {["1", "5", "10", "15", "20", "100"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="border-border mx-1 border-t px-5 py-3 sm:border-0 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:justify-normal">
          <div className="flex items-center gap-2">
            <PaginationButton
              className="border-0 bg-transparent disabled:opacity-40"
              disabled={atFirst}
              onClick={pagination?.goFirst}
            >
              <LuChevronFirst />
            </PaginationButton>
            <PaginationButton
              disabled={atFirst}
              className="disabled:opacity-40"
              onClick={pagination?.goPrev}
            >
              <LuChevronLeft />
            </PaginationButton>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{pageLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <PaginationButton
              disabled={atLast}
              className="disabled:opacity-40"
              onClick={pagination?.goNext}
            >
              <LuChevronRight />
            </PaginationButton>
            <PaginationButton
              className="border-0 bg-transparent disabled:opacity-40"
              disabled={atLast}
              onClick={pagination?.goLast}
            >
              <LuChevronLast />
            </PaginationButton>
          </div>
        </div>
      </div>
    </footer>
  );
}
export {
  Table,
  TableBody,
  EmptyBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableFooter,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableRowLink,
  TableWrapper,
  rowLinkRowClasses,
  rowSheetIcon,
};
