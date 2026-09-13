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
import { type PaginationState } from "@/ascendra-ui/providers/data-table/use-pagination.hook";
import {
  buildBorderClasses,
  buildBorderBeforeClasses,
  buildBgBeforeClasses,
  type BorderConfig,
  type BgConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import {
  LuChevronFirst,
  LuChevronLast,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";

export type ColVisibility = { key: PropertyKey; active?: boolean };

export type BatchState = {
  currentBatch: number;
  totalBatches: number | null;
  goNextBatch: () => void;
  goPrevBatch: () => void;
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
  const ref = React.useRef<HTMLDivElement>(null);

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
      <div
        ref={ref}
        data-slot="table-container"
        className={cn(
          "",
          scrollable && horizontal && "-mb-px overflow-x-auto pb-px",
          scrollable && vertical && height && "overflow-y-auto",
        )}
        style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
      >
        <table
          data-slot="table"
          className={cn("w-full border-separate border-spacing-0", className)}
          {...props}
        />
      </div>
    </TableScrollContext.Provider>
  );
}

function TableHeader({
  sticky = false,
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
      className={cn("text-secondary-foreground text-left text-xs", className)}
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
  ...props
}: React.ComponentProps<"tbody"> & { border?: BorderConfig; bg?: BgConfig }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "relative isolate transform-[translateZ(0)]",
        !bg && "before:bg-background",
        "before:absolute before:inset-0 before:-z-10 before:mx-1 before:rounded-lg",
        "before:ring-1 before:ring-(--color-umbra)/4 dark:before:ring-black/20",
        "before:shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08)]",
        "dark:before:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.01),0_1px_3px_0_rgba(0,0,0,2),0_0_3px_0_rgba(0,0,0,0.2)",
        "[&>tr:not(:last-child)>td]:border-border [&>tr:not(:last-child)>td]:border-b",
        border && buildBorderBeforeClasses(border),
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
        "relative isolate transform-[translateZ(0)]",
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
        "group/row transition-colors [clip-path:inset(0_4px)] first:[clip-path:inset(0_4px_0_4px_round_8px_8px_0_0)] last:[clip-path:inset(0_4px_0_4px_round_0_0_8px_8px)] first:last:[clip-path:inset(0_4px_round_8px)] hover:bg-gray-700/4",
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
      className={cn("py-3 pr-5 pl-5 first:pl-6", className)}
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

  const atFirstBatch = !batch || batch.currentBatch <= 1;
  const atLastBatch =
    !!batch &&
    batch.totalBatches !== null &&
    batch.currentBatch >= batch.totalBatches;
  const batchLabel = batch
    ? batch.totalBatches !== null
      ? `${batch.currentBatch} / ${batch.totalBatches}`
      : `${batch.currentBatch}`
    : "";

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
                >
                  <LuChevronLeft />
                </PaginationButton>
                <span>{batchLabel}</span>
                <PaginationButton
                  disabled={atLastBatch}
                  className="border-0 bg-transparent disabled:opacity-40"
                  onClick={batch.goNextBatch}
                >
                  <LuChevronRight />
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
