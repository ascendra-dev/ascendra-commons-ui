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
import { copyToClipboard } from "@/ascendra-ui/utils/clipboard.util";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LuCopy, LuCopyCheck, LuLayoutList } from "react-icons/lu";
import { toast } from "@/ascendra-ui/components/common-ui/toast";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { RxCrossCircled } from "react-icons/rx";
import { FilterChip, FilterChipValue } from "./filter-chip";
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
    runToRestore,
    fieldOptions,
  } = useQueryContext();
  // While a filter's form is open nothing new has run (runParams is null), but closing it restores the earlier run —
  // so the bar keeps describing that one, read-only: its mutes and sort belong to a run that's set aside.
  const editing = runParams === null && runToRestore !== null;
  const shownParams = editing ? runToRestore.params : runParams;
  const shownMuted = editing ? runToRestore.muted : mutedParams;
  const runCriteria = describeQueryCriteria(
    (runSourceQuery.params ?? []).filter(isFieldDef),
    shownParams,
    fieldOptions[runSourceQuery.id],
  );
  const appliedCount = runCriteria.criteria.filter(
    (c) => !shownMuted.includes(c.name),
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
                  // The criteria chips' pill, slimmed so it doesn't add to the bar's height.
                  <FilterChip
                    className="shrink-0 py-0 leading-4"
                    label={
                      <span className="text-muted-foreground">
                        {appliedCount} {appliedCount === 1 ? "criterion" : "criteria"}
                      </span>
                    }
                  />
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
                    muted={shownMuted}
                    readOnly={editing}
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
  muted,
  readOnly,
  onRunChanged,
}: {
  query: QueryDef;
  /** The run's criteria — only on the selected item. */
  criteria: QueryCriteria | null;
  /** The run's muted fields — shown struck through. */
  muted: string[];
  /** The run is set aside while a filter's form is open: its criteria show, but can't be muted or re-sorted, and
   *  there's no link to copy. */
  readOnly: boolean;
  onRunChanged: () => void;
}) {
  const hasCriteria = !!criteria && (criteria.criteria.length > 0 || !!criteria.orderBy);
  return (
    // No tick: the selected item shows the closed bar's sparkle before its title (plus its copy-link button and
    // criteria) — no background, so hover stays the only highlight. pr-2: no tick needs the room on the right.
    <DropdownMenuRadioItem value={query.id} className="items-start pr-2" indicator={null}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            {criteria && <Sparkles className="text-muted-foreground size-3 shrink-0" strokeWidth={2} />}
            {query.title}
          </span>
          {criteria && !readOnly && <CopyRunLinkButton />}
        </span>
        <span className="text-muted-foreground text-xs">
          {query.description}
        </span>
        {hasCriteria && (
          <RunCriteria criteria={criteria} muted={muted} readOnly={readOnly} onRunChanged={onRunChanged} />
        )}
      </div>
    </DropdownMenuRadioItem>
  );
}

function RunCriteria({
  criteria: { criteria, orderBy },
  muted: mutedParams,
  readOnly,
  onRunChanged,
}: {
  criteria: QueryCriteria;
  muted: string[];
  readOnly: boolean;
  onRunChanged: () => void;
}) {
  const { toggleParamMuted } = useQueryContext();
  const orderByMuted = !!orderBy && mutedParams.includes(orderBy.name);

  // The chip's icon + label mutes or restores it, then closes the menu — without selecting the item it sits in.
  // The item selects on pointer-up/click, so neither may reach it, or it would re-run the query.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const muteAction = (name: string, label: string, muted: boolean) => ({
    icon: muted ? <IoArrowBackCircleOutline /> : <RxCrossCircled />,
    "aria-label": muted ? `Restore ${label}` : `Mute ${label}`,
    onPointerDown: stop,
    onPointerUp: stop,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleParamMuted(name);
      onRunChanged();
    },
  });

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {criteria.map((criterion) => {
        const muted = mutedParams.includes(criterion.name);
        return (
          <FilterChip
            key={criterion.name}
            label={
              <span className={cn("text-muted-foreground", muted && MUTED_CLASS)}>{criterion.label}</span>
            }
            // Required fields can't be muted — the run needs them; nor can a run that's set aside.
            action={criterion.required || readOnly ? undefined : muteAction(criterion.name, criterion.label, muted)}
          >
            {/* A checkbox criterion has no value — just its label. */}
            {criterion.text && (
              <FilterChipValue>
                <TruncatedText fullText={criterion.text} className={cn("text-foreground", muted && MUTED_CLASS)}>
                  {criterion.text}
                </TruncatedText>
              </FilterChipValue>
            )}
          </FilterChip>
        );
      })}
      {orderBy && (
        <FilterChip
          label={<span className={cn("text-muted-foreground", orderByMuted && MUTED_CLASS)}>{orderBy.label}</span>}
          action={orderBy.required || readOnly ? undefined : muteAction(orderBy.name, orderBy.label, orderByMuted)}
        >
          <FilterChipValue className={cn("flex-wrap gap-x-1.5 gap-y-0.5", orderByMuted && MUTED_CLASS)}>
            {orderBy.columns.map((column, i) => (
              <span key={i} className="text-foreground inline-flex items-center gap-0.5">
                {i > 0 && <span className="text-muted-foreground/60 mr-1">·</span>}
                {column.label}
                <SortDirectionButton
                  name={orderBy.name}
                  column={column}
                  // A muted sort isn't part of the run — nothing to flip; nor is a run that's set aside.
                  disabled={orderByMuted || readOnly}
                  onToggled={onRunChanged}
                />
              </span>
            ))}
          </FilterChipValue>
        </FilterChip>
      )}
    </div>
  );
}

/** How a muted criterion shows — struck through, faded. */
const MUTED_CLASS = "line-through opacity-60";

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
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const Icon = copied ? LuCopyCheck : LuCopy;
  // The menu item selects on pointer-up/click — keep both from reaching it.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    // Hover says what it does; after a copy the same tooltip confirms it, until COPIED_MS passes.
    <Tooltip open={hovered || copied} onOpenChange={setHovered}>
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
            if (await copyToClipboard(link)) setCopied(true);
            else toast.error("Couldn't copy the link");
          }}
        >
          <Icon className={cn("size-3.5", copied && "text-green-600")} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? "Query link copied to clipboard" : "Copy query link"}</TooltipContent>
    </Tooltip>
  );
}

/** Flips one sort column between ascending and descending and re-runs — then closes the menu, like the mute action. */
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
      className="hover:bg-background inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5"
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
