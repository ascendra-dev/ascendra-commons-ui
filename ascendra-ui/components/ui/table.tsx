"use client";

import * as React from "react";

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
import { type PaginationState } from "@/ascendra-ui/providers/data-table/use-pagination.hook";
import {
  buildBorderClasses,
  buildBorderAfterClasses,
  buildBgBeforeClasses,
  type BorderConfig,
  type BgConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import {
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
 *  scroll. Starts under the header row (fixed at h-10) and ends 1px above the host's bottom, so the scrollbar
 *  library's overflow clip on the host keeps the bottom ring (the 1px comes from tableClasses' mb-px, taken back by
 *  the host's -mb-px). The layer-coloured spread under the ring covers whatever scrolls into the rounded corners;
 *  the clip-path trims it to 4px around the card, rounded like the layer's own corners (card radius + 4px) — square,
 *  it filled the layer's rounded corners when the card sat at the layer's bottom. Drawn only with a body. */
export const tableCardFrameClasses = cn(
  "relative -mb-px",
  "has-[tbody]:after:pointer-events-none has-[tbody]:after:absolute has-[tbody]:after:inset-x-1 has-[tbody]:after:top-10 has-[tbody]:after:bottom-px has-[tbody]:after:z-2 has-[tbody]:after:rounded-lg has-[tbody]:after:[clip-path:inset(-4px_round_calc(var(--radius-lg)+4px))]",
  "has-[tbody]:after:ring-1 has-[tbody]:after:ring-(--color-umbra)/4 dark:has-[tbody]:after:ring-black/20",
  "has-[tbody]:after:shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08),0_0_0_var(--radius-lg)_var(--muted)]",
  // The vertical scrollbar runs beside the rows only, not the sticky header. Important: the library's stylesheet
  // is unlayered, so it beats any Tailwind utility.
  "[&>.os-scrollbar-vertical]:top-10!",
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
      data-table-container
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
  className,
  ...props
}: React.ComponentProps<"table"> & {
  scrollable?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
  height?: number;
  minHeight?: number;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const scrollX = scrollable && horizontal;
  const scrollY = scrollable && vertical && !!height;
  useOverlayScrollbars(hostRef, ref, {
    x: scrollX ? "scroll" : "hidden",
    y: scrollY ? "scroll" : "hidden",
    enabled: scrollX || scrollY,
  });

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !vertical) return;
    const handler = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [vertical]);

  const wrapperStyle: React.CSSProperties = {};
  if (scrollable && vertical && height) wrapperStyle.maxHeight = `${height}px`;
  if (minHeight) wrapperStyle.minHeight = `${minHeight}px`;

  return (
    <TableScrollContext.Provider
      value={{ scrolled, vscroll: scrollable && vertical && !!height }}
    >
      <div ref={hostRef} className={tableCardFrameClasses}>
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
  ...props
}: React.ComponentProps<"thead"> & { sticky?: boolean }) {
  const { scrolled, vscroll } = React.useContext(TableScrollContext);
  return (
    <thead
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

function TableHeaderRow({
  columns,
  className,
  children,
  ...props
}: React.ComponentProps<"tr"> & { columns?: ColVisibility[] }) {
  const content = columns
    ? filterChildrenByColumns(columns, children)
    : children;
  return (
    <tr
      data-slot="table-header-row"
      // A fixed height — the card frame starts right under it.
      className={cn("text-secondary-foreground h-10 text-left text-xs [&>th]:py-0", className)}
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

function TableRow({
  columns,
  className,
  children,
  ...props
}: React.ComponentProps<"tr"> & { columns?: ColVisibility[] }) {
  const content = columns
    ? filterChildrenByColumns(columns, children)
    : children;
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group/row transition-colors hover:bg-gray-700/4",
        className,
      )}
      {...props}
    >
      {content}
    </tr>
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
  TableWrapper,
};
