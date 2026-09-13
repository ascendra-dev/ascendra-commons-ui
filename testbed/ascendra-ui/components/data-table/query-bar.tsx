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
import type { QueryGroup } from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { LuLayoutList } from "react-icons/lu";
import { ManageQueriesDialog } from "./manage-queries-dialog";

const GROUP_LABELS: Record<QueryGroup, string> = {
  query: "Queries",
  "user-query": "My Queries",
  filter: "Filters",
};

const GROUP_ORDER: QueryGroup[] = ["query", "user-query", "filter"];

export function QueryBar() {
  const {
    queries,
    confirmedQueryId,
    setActiveQueryId,
    isLoading,
    isInitializing,
  } = useQueryContext();
  const confirmedQuery =
    queries.find((q) => q.id === confirmedQueryId) ?? queries[0];

  const [manageOpen, setManageOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
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
            {GROUP_ORDER.map((group, i) => {
              const items = queries.filter((q) => q.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{GROUP_LABELS[group]}</DropdownMenuLabel>
                  {items.map((query) => (
                    <DropdownMenuRadioItem key={query.id} value={query.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{query.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {query.description}
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </div>
              );
            })}
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
