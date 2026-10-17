"use client";

import { Button } from "@/ascendra-ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ascendra-ui/components/ui/dropdown-menu";
import { useQueryContext } from "@/ascendra-ui/providers/data-table-query/data-table-query.provider";
import type {
  QueryDef,
  QueryGroup,
} from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import { isFieldDef } from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import {
  describeQueryCriteria,
  type QueryCriteria,
  type QueryOrderBy,
} from "@/ascendra-ui/providers/data-table-query/query-criteria";
import { cn } from "@/ascendra-ui/shadcn";
import { SimpleBadge } from "@/ascendra-ui/components/common-ui/simple-badge";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LuCopy, LuCopyCheck, LuLayoutList } from "react-icons/lu";
import { toast } from "@/ascendra-ui/components/common-ui/toast";
import { formatSortToken, parseSortToken } from "@/ascendra-ui/utils/order-by.util";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ascendra-ui/components/ui/tooltip";
import { ManageQueriesDialog } from "./manage-queries-dialog";

type ListedGroup = Exclude<QueryGroup, "trigger">;

const GROUP_LABELS: Record<ListedGroup, string> = {
  query: "Queries",
  "user-query": "My Queries",
  filter: "Filters",
};

const GROUP_ORDER: ListedGroup[] = ["query", "user-query", "filter"];

export function QueryBar() {
  const {
    queries,
    confirmedQuery,
    confirmedQueryId,
    setActiveQueryId,
    isLoading,
    isInitializing,
    runParams,
    runSourceQuery,
    mutedParams,
    fieldOptions,
  } = useQueryContext();
  const runCriteria = describeQueryCriteria(
    (runSourceQuery.params ?? []).filter(isFieldDef),
    runParams,
    fieldOptions[runSourceQuery.id],
  );
  const appliedCount = runCriteria.criteria.filter(
    (c) => !mutedParams.includes(c.name),
  ).length;
  // A trigger, or a query hidden in Manage Queries, can be showing without being listed — it goes last in its own
  // section (a trigger in Filters), selected like any other item.
  const unlisted = queries.some((q) => q.id === confirmedQueryId)
    ? null
    : confirmedQuery;
  const unlistedGroup =
    unlisted?.group === "trigger" ? "filter" : unlisted?.group;
  const sections = GROUP_ORDER.map((group) => ({
    group,
    items: [
      ...queries.filter((q) => q.group === group),
      ...(unlisted && unlistedGroup === group ? [unlisted] : []),
    ],
  })).filter((section) => section.items.length > 0);

  const [manageOpen, setManageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="min-w-0 flex-1 justify-start gap-2 px-3 font-normal"
          >
            {isLoading ? (
              <Loader2
                className="text-muted-foreground size-3 shrink-0 animate-spin"
                strokeWidth={2}
              />
            ) : (
              <Sparkles
                className="text-muted-foreground size-3 shrink-0"
                strokeWidth={2}
              />
            )}
            {!isInitializing && (
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="text-foreground shrink-0 font-medium">
                  {confirmedQuery.title}
                </span>
                <span className="text-muted-foreground/60 shrink-0">·</span>
                <span className="text-muted-foreground truncate">
                  {confirmedQuery.description}
                </span>
                {appliedCount > 0 && (
                  <SimpleBadge variant="secondary">
                    {appliedCount} {appliedCount === 1 ? "criterion" : "criteria"}
                  </SimpleBadge>
                )}
              </span>
            )}
            <ChevronDown
              className="text-muted-foreground ml-auto size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
              strokeWidth={2}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={4}
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuRadioGroup
            value={confirmedQueryId}
            onValueChange={setActiveQueryId}
          >
            {sections.map(({ group, items }, i) => (
              <div key={group}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{GROUP_LABELS[group]}</DropdownMenuLabel>
                {items.map((query) => (
                  <QueryRadioItem
                    key={query.id}
                    query={query}
                    criteria={query.id === confirmedQueryId ? runCriteria : null}
                    onRunChanged={() => setMenuOpen(false)}
                  />
                ))}
              </div>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setManageOpen(true)}>
            <LuLayoutList className="size-3.5" strokeWidth={2} />
            Manage Queries
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageQueriesDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}

function QueryRadioItem({
  query,
  criteria,
  onRunChanged,
}: {
  query: QueryDef;
  /** The run's criteria — only on the selected item. */
  criteria: QueryCriteria | null;
  onRunChanged: () => void;
}) {
  const hasCriteria = !!criteria && (criteria.criteria.length > 0 || !!criteria.orderBy);
  return (
    // The tick sits on the title row (h-5 = its line height), not centred on the whole item.
    <DropdownMenuRadioItem
      value={query.id}
      className="items-start [&>[data-slot=dropdown-menu-radio-item-indicator]]:h-5"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-2">
          <span className="font-medium">{query.title}</span>
          {criteria && <CopyRunLinkButton />}
        </span>
        <span className="text-muted-foreground text-xs">
          {query.description}
        </span>
        {hasCriteria && (
          <RunCriteria criteria={criteria} onRunChanged={onRunChanged} />
        )}
      </div>
    </DropdownMenuRadioItem>
  );
}

function RunCriteria({
  criteria: { criteria, orderBy },
  onRunChanged,
}: {
  criteria: QueryCriteria;
  onRunChanged: () => void;
}) {
  const { mutedParams } = useQueryContext();
  const orderByMuted = !!orderBy && mutedParams.includes(orderBy.name);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {criteria.map((criterion) => {
        const muted = mutedParams.includes(criterion.name);
        // The tooltip repeats only the value — a checkbox criterion has none, so its label.
        const fullText = criterion.text || criterion.label;
        return (
          <SimpleBadge
            key={criterion.name}
            variant="secondary"
            // SimpleBadge centres its content in an inner span — let that span shrink so long text truncates.
            className="max-w-full justify-start [&>span]:min-w-0"
          >
            <TruncatedText
              fullText={fullText}
              className={cn(muted && "line-through opacity-60")}
            >
              {criterion.text ? (
                <>
                  {criterion.label}:{" "}
                  <span className="text-foreground">{criterion.text}</span>
                </>
              ) : (
                <span className="text-foreground">{criterion.label}</span>
              )}
            </TruncatedText>
            {!criterion.required && (
              <MuteButton
                name={criterion.name}
                label={criterion.label}
                muted={muted}
                onToggled={onRunChanged}
              />
            )}
          </SimpleBadge>
        );
      })}
      {orderBy && (
        <span className="text-muted-foreground ml-1 inline-flex items-center gap-1.5 text-xs">
          <span className="shrink-0">{orderBy.label}</span>
          <span
            className={cn(
              "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5",
              orderByMuted && "line-through opacity-60",
            )}
          >
            {orderBy.columns.map((column, i) => (
              <span key={i} className="text-foreground inline-flex items-center gap-0.5">
                {i > 0 && <span className="text-muted-foreground/60 mr-1">·</span>}
                {column.label}
                <SortDirectionButton
                  name={orderBy.name}
                  column={column}
                  // A muted sort isn't part of the run — nothing to flip.
                  disabled={orderByMuted}
                  onToggled={onRunChanged}
                />
              </span>
            ))}
          </span>
          {!orderBy.required && (
            <MuteButton
              name={orderBy.name}
              label={orderBy.label}
              muted={orderByMuted}
              onToggled={onRunChanged}
            />
          )}
        </span>
      )}
    </div>
  );
}

/** Truncates with "…" and shows the full text in a tooltip — only when it's actually cut off. */
function TruncatedText({
  fullText,
  className,
  children,
}: {
  fullText: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const isTruncated = () =>
    !!ref.current && ref.current.scrollWidth > ref.current.clientWidth;
  return (
    <Tooltip open={open} onOpenChange={(next) => setOpen(next && isTruncated())}>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("min-w-0 truncate", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{fullText}</TooltipContent>
    </Tooltip>
  );
}

const COPIED_MS = 1500;

/** Copies a link that re-runs what's showing — the menu stays open so the confirmation tooltip shows. */
function CopyRunLinkButton() {
  const { getRunLink } = useQueryContext();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const Icon = copied ? LuCopyCheck : LuCopy;
  // The menu item selects on pointer-up/click — keep both from reaching it.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    // Controlled: the tooltip is only the "copied" confirmation — it never opens on hover.
    <Tooltip open={copied}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Copy query link"
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5"
          onPointerDown={stop}
          onPointerUp={stop}
          onClick={async (e) => {
            e.stopPropagation();
            const link = getRunLink();
            if (!link) return;
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            } catch {
              toast.error("Couldn't copy the link");
            }
          }}
        >
          <Icon className={cn("size-3.5", copied && "text-green-600")} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">Query link copied to clipboard</TooltipContent>
    </Tooltip>
  );
}

/** Flips one sort column between ascending and descending and re-runs — then closes the menu, like MuteButton. */
function SortDirectionButton({
  name,
  column,
  disabled,
  onToggled,
}: {
  name: string;
  column: QueryOrderBy["columns"][number];
  disabled: boolean;
  onToggled: () => void;
}) {
  const { runParams, setRunParam } = useQueryContext();
  const Arrow = column.direction === "desc" ? ArrowDown : ArrowUp;
  const next = column.direction === "desc" ? "ascending" : "descending";
  // The menu item selects on pointer-up/click — keep both from reaching it.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  if (disabled) return <Arrow className="size-3" strokeWidth={2} />;
  return (
    <button
      type="button"
      aria-label={`Sort ${column.label} ${next}`}
      className="hover:bg-muted inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5"
      onPointerDown={stop}
      onPointerUp={stop}
      onClick={(e) => {
        e.stopPropagation();
        const tokens = runParams?.[name];
        if (!Array.isArray(tokens)) return;
        const key = parseSortToken(column.token);
        if (!key) return;
        const flipped = formatSortToken({ ...key, direction: key.direction === "desc" ? "asc" : "desc" });
        setRunParam(name, tokens.map((t) => (t === column.token ? flipped : t)));
        onToggled();
      }}
    >
      <Arrow className="size-3" strokeWidth={2} />
    </button>
  );
}

/** Mutes or restores one criterion, then closes the menu — without selecting the item it sits in. */
function MuteButton({
  name,
  label,
  muted,
  onToggled,
}: {
  name: string;
  label: string;
  muted: boolean;
  onToggled: () => void;
}) {
  const { toggleParamMuted } = useQueryContext();
  const Icon = muted ? RotateCcw : X;
  // The menu item selects on pointer-up/click — keep both from reaching it, or it would re-run the query.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <button
      type="button"
      aria-label={muted ? `Restore ${label}` : `Mute ${label}`}
      className="hover:text-foreground hover:bg-muted inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5"
      onPointerDown={stop}
      onPointerUp={stop}
      onClick={(e) => {
        e.stopPropagation();
        toggleParamMuted(name);
        onToggled();
      }}
    >
      <Icon className="size-3" strokeWidth={2} />
    </button>
  );
}
