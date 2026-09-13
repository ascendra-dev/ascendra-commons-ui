"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ascendra-ui/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ascendra-ui/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/ascendra-ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ascendra-ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
} from "@/ascendra-ui/components/ui/table";
import { cn } from "@/ascendra-ui/shadcn";
import { ArrowUpIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { LuLoader, LuTextSearch } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableLookupColumn<T> = {
  key: keyof T & string;
  label: string;
  width?: number;
  searchable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
};

export type TableLookupProps<T extends Record<string, unknown>> = {
  columns: TableLookupColumn<T>[];
  valueKey: keyof T & string;
  labelKey: keyof T & string;
  mode?: "single" | "multiple";
  onSearch: (query: string, searchField?: string) => Promise<T[]> | T[];
  value?: T | T[] | null;
  onChange?: (value: T | T[] | null) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  dialogClassName?: string;
};

// ─── Trigger chip (inside the multi-mode trigger) ────────────────────────────

function TriggerChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      className={cn(
        "text-foreground bg-gray-100",
        "border border-gray-200",
        "dark:border-(--color-gray-1100) dark:bg-(--color-gray-1300)",
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1",
        "rounded-[0.25rem] pl-1.5 pr-0 text-xs font-medium whitespace-nowrap",
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="-mr-0.5 flex items-center justify-center rounded-xs p-0.5 opacity-50 hover:bg-black/5 hover:opacity-100 focus-visible:outline-1 dark:hover:bg-white/10"
      >
        <XIcon className="pointer-events-none size-3" />
      </button>
    </span>
  );
}

// ─── Single-mode trigger (SelectTrigger style) ───────────────────────────────

const SingleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    label?: string;
    placeholder?: string;
  }
>(({ label, placeholder, disabled, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled}
    data-slot="table-lookup-trigger"
    className={cn(
      "py-0.75",
      "group relative inline-flex w-full items-center px-1",
      "overflow-hidden rounded-[0.25rem]",
      "text-sm font-medium",
      label ? "text-foreground" : "text-muted-foreground font-normal",
      "bg-secondary",
      "shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]",
      "dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]",
      "before:pointer-events-none before:absolute before:inset-0",
      "before:bg-linear-to-b before:from-black/0 before:to-black/2 before:from-30%",
      "before:transition-opacity dark:before:to-black/12",
      "cursor-pointer transition-all",
      "hover:before:opacity-0 hover:bg-gray-50 dark:hover:bg-secondary",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "focus-visible:outline-primary! focus-visible:outline-2! focus-visible:outline-offset-1!",
      "aria-invalid:outline-destructive aria-invalid:outline-2 aria-invalid:outline-offset-1",
      "h-8",
      className,
    )}
    {...props}
  >
    <div className="flex w-full items-center justify-between">
      <span className="px-1.25 flex-1 truncate text-left">
        {label ?? placeholder ?? "Select…"}
      </span>
      <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180" />
    </div>
  </button>
));
SingleTrigger.displayName = "SingleTrigger";

// ─── Multiple-mode trigger (ComboboxChips style) ─────────────────────────────

const MultiTrigger = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<"div">, "onRemove"> & {
    selectedItems: Record<string, unknown>[];
    labelKey: string;
    valueKey: string;
    placeholder?: string;
    disabled?: boolean;
    open?: boolean;
    onRemove: (value: unknown) => void;
  }
>(
  (
    {
      selectedItems,
      labelKey,
      valueKey,
      placeholder,
      disabled,
      open,
      onRemove,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-slot="table-lookup-trigger"
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      className={cn(
        "group/input-group relative flex min-h-8 w-full flex-wrap items-center gap-1.5 px-1 py-1",
        "overflow-hidden rounded-[0.25rem]",
        "text-foreground font-medium",
        "bg-secondary",
        "shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]",
        "dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-linear-to-b before:from-black/0 before:to-black/2 before:from-30%",
        "before:transition-opacity dark:before:to-black/12",
        "cursor-pointer select-none transition-all",
        "hover:before:opacity-0 hover:bg-gray-50 dark:hover:bg-secondary",
        disabled && "cursor-not-allowed opacity-40",
        "focus-visible:outline-primary! focus-visible:outline-2! focus-visible:outline-offset-1!",
        "aria-invalid:outline-destructive aria-invalid:outline-2 aria-invalid:outline-offset-1",
        className,
      )}
      {...props}
    >
      {selectedItems.length === 0 ? (
        <span className="flex-1 px-1 text-sm font-normal text-muted-foreground">
          {placeholder ?? "Select…"}
        </span>
      ) : (
        selectedItems.map((item) => (
          <TriggerChip
            key={String(item[valueKey])}
            label={String(item[labelKey])}
            onRemove={(e) => {
              e.stopPropagation();
              onRemove(item[valueKey]);
            }}
          />
        ))
      )}
      <ChevronDownIcon
        className={cn(
          "text-muted-foreground pointer-events-none ml-auto size-4 shrink-0 transition-transform duration-150",
          open && "rotate-180",
        )}
      />
    </div>
  ),
);
MultiTrigger.displayName = "MultiTrigger";

// ─── TableLookup ─────────────────────────────────────────────────────────────

function TableLookup<T extends Record<string, unknown>>({
  columns,
  valueKey,
  labelKey,
  mode = "single",
  onSearch,
  value,
  onChange,
  placeholder,
  title,
  disabled,
  invalid,
  className,
  dialogClassName,
}: TableLookupProps<T>) {
  const [open, setOpen] = React.useState(false);
  const instanceKey = React.useRef(`table-lookup-${Math.random()}`);

  const searchableColumns = React.useMemo(
    () => columns.filter((col) => col.searchable),
    [columns],
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchField, setSearchField] = React.useState("all");

  const selectedItems = React.useMemo<T[]>(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  const [committedSearch, setCommittedSearch] = React.useState<{
    query: string;
    field: string;
  } | null>(null);

  const { data: rows = [], isFetching: loading } = useQuery({
    queryKey: [instanceKey.current, committedSearch?.query, committedSearch?.field],
    queryFn: () =>
      Promise.resolve(
        onSearch(
          committedSearch!.query,
          committedSearch!.field === "all" ? undefined : committedSearch!.field,
        ),
      ),
    enabled: committedSearch !== null,
    staleTime: Infinity,
  });

  React.useEffect(() => {
    if (!open) return;
    if (selectedItems.length > 0) return;
    setCommittedSearch({ query: searchQuery, field: searchField });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSearch = React.useCallback(() => {
    setCommittedSearch({ query: searchQuery, field: searchField });
  }, [searchQuery, searchField]);

  const handleFieldChange = React.useCallback(
    (field: string) => {
      setSearchField(field);
      setCommittedSearch({ query: searchQuery, field });
    },
    [searchQuery],
  );

  const handleRemove = React.useCallback(
    (itemValue: unknown) => {
      if (mode === "single") {
        onChange?.(null);
      } else {
        const next = selectedItems.filter(
          (item) => item[valueKey] !== itemValue,
        );
        onChange?.(next.length ? next : null);
      }
    },
    [mode, selectedItems, valueKey, onChange],
  );

  const handleSelect = React.useCallback(
    (row: T) => {
      if (mode === "single") {
        onChange?.(row);
        setOpen(false);
      } else {
        const isSelected = selectedItems.some(
          (item) => item[valueKey] === row[valueKey],
        );
        const next = isSelected
          ? selectedItems.filter((item) => item[valueKey] !== row[valueKey])
          : [...selectedItems, row];
        onChange?.(next.length ? next : null);
      }
    },
    [mode, onChange, selectedItems, valueKey],
  );

  const singleLabel =
    selectedItems.length === 1 ? String(selectedItems[0][labelKey]) : undefined;

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DialogTrigger asChild>
        {mode === "single" ? (
          <SingleTrigger
            label={singleLabel}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className={className}
          />
        ) : (
          <MultiTrigger
            selectedItems={selectedItems as Record<string, unknown>[]}
            labelKey={labelKey}
            valueKey={valueKey}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            onRemove={handleRemove}
            open={open}
            className={className}
          />
        )}
      </DialogTrigger>

      <DialogContent className={cn("max-w-3xl", dialogClassName)}>
        {/* ── Header ── */}
        <DialogHeader className="flex-row items-center justify-between py-3.5">
          <DialogTitle className="text-sm">
            {title ?? (mode === "multiple" ? "Select items" : "Select")}
          </DialogTitle>
        </DialogHeader>

        {/* ── Selected chips area ── */}
        <div className="flex min-h-11 max-h-24 flex-wrap items-start gap-1.5 overflow-y-auto px-4 pt-4">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground self-center text-xs italic">
              No items selected
            </span>
          ) : (
            selectedItems.map((item) => (
              <TriggerChip
                key={String(item[valueKey])}
                label={String(item[labelKey])}
                onRemove={(e) => {
                  e.stopPropagation();
                  handleRemove(item[valueKey]);
                }}
              />
            ))
          )}
        </div>

        {/* ── Table area ── */}
        <div className="p-4">
          <TableWrapper>
            <Table scrollable horizontal vertical height={280} minHeight={280}>
              <TableHeader>
                <TableHeaderRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      style={col.width ? { minWidth: col.width } : undefined}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableHeaderRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <div className="flex h-60 items-center justify-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <LuLoader
                                className="animate-spin"
                                strokeWidth={2}
                              />
                            </EmptyMedia>
                            <EmptyTitle>Loading…</EmptyTitle>
                            <EmptyDescription>
                              Please wait while data is being fetched.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <div className="flex h-60 items-center justify-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <LuTextSearch strokeWidth={2} />
                            </EmptyMedia>
                            <EmptyTitle>No results found</EmptyTitle>
                            <EmptyDescription>
                              Try adjusting your search terms.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const isSelected = selectedItems.some(
                      (s) => s[valueKey] === row[valueKey],
                    );
                    return (
                      <TableRow
                        key={String(row[valueKey])}
                        onClick={() => handleSelect(row)}
                        className={cn(
                          "cursor-pointer",
                          isSelected
                            ? "bg-primary/5 hover:bg-primary/5"
                            : "",
                        )}
                      >
                        {columns.map((col, colIdx) => {
                          const isLast = colIdx === columns.length - 1;
                          const content = col.render
                            ? col.render(row[col.key], row)
                            : String(row[col.key] ?? "");
                          return (
                            <TableCell key={col.key}>
                              {isLast ? (
                                <div
                                  className="truncate"
                                  style={
                                    col.width
                                      ? { maxWidth: col.width }
                                      : undefined
                                  }
                                >
                                  {content}
                                </div>
                              ) : (
                                content
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>

        {/* ── Search bar ── */}
        <div className="px-4 pb-3">
          <InputGroup>
            <InputGroupTextarea
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSearchQuery(e.target.value)
              }
              placeholder={
                searchableColumns.length === 1
                  ? `Search by ${searchableColumns[0].label}…`
                  : "Search…"
              }
              rows={2}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              {searchableColumns.length > 1 ? (
                <Select value={searchField} onValueChange={handleFieldChange}>
                  <SelectTrigger
                    size="sm"
                    className="h-auto border-0 bg-transparent py-0 shadow-none ring-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" className="z-1001">
                    <SelectItem value="all">All</SelectItem>
                    {searchableColumns.map((col) => (
                      <SelectItem key={col.key} value={col.key}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-muted-foreground text-xs">
                  {searchableColumns[0]?.label ?? ""}
                </span>
              )}
              <InputGroupButton
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                className="size-7"
              >
                {loading ? (
                  <LuLoader className="animate-spin" strokeWidth={2} />
                ) : (
                  <ArrowUpIcon />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { TableLookup };
