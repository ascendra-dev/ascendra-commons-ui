"use client";

import { Button } from "@/ascendra-ui/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ascendra-ui/components/ui/dialog";
import { Switch } from "@/ascendra-ui/components/ui/switch";
import { useQueryContext } from "@/ascendra-ui/providers/data-table-query/data-table-query.provider";
import type { QueryGroup } from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import { cn } from "@/ascendra-ui/shadcn";
import { useEffect, useRef, useState } from "react";
import { LuSquareMinus, LuSquarePlay } from "react-icons/lu";
import { RiDraggable } from "react-icons/ri";

const GROUP_LABELS: Record<QueryGroup, string> = {
  query: "Queries",
  "user-query": "My Queries",
  filter: "Filters",
};

const GROUP_ORDER: QueryGroup[] = ["query", "user-query", "filter"];

interface LocalItem {
  id: string;
  title: string;
  description: string;
  group: QueryGroup;
  enabled: boolean;
}

interface ManageQueriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageQueriesDialog({
  open,
  onOpenChange,
}: ManageQueriesDialogProps) {
  const {
    allQueries,
    disabledQueryIds,
    toggleQueryEnabled,
    reorderQueriesInGroup,
    removeUserQuery,
    setActiveQueryId,
  } = useQueryContext();

  const [localGroups, setLocalGroups] = useState<
    Record<QueryGroup, LocalItem[]>
  >({
    query: [],
    "user-query": [],
    filter: [],
  });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Track dragged item — includes its group so we can prevent cross-group drops
  const dragRef = useRef<{ id: string; group: QueryGroup } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sync from context whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    const disabledSet = new Set(disabledQueryIds);
    const groups: Record<QueryGroup, LocalItem[]> = {
      query: [],
      "user-query": [],
      filter: [],
    };
    for (const q of allQueries) {
      groups[q.group].push({
        id: q.id,
        title: q.title,
        description: q.description,
        group: q.group,
        enabled: !disabledSet.has(q.id),
      });
    }
    setLocalGroups(groups);
    setPendingDeleteId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleToggle(item: LocalItem) {
    setLocalGroups((prev) => ({
      ...prev,
      [item.group]: prev[item.group].map((q) =>
        q.id === item.id ? { ...q, enabled: !q.enabled } : q,
      ),
    }));
    toggleQueryEnabled(item.id);
  }

  function handleRun(id: string) {
    setActiveQueryId(id);
    onOpenChange(false);
  }

  function handleDelete(id: string) {
    if (pendingDeleteId === id) {
      removeUserQuery(id);
      setLocalGroups((prev) => ({
        ...prev,
        "user-query": prev["user-query"].filter((q) => q.id !== id),
      }));
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
    }
  }

  function handleDragStart(item: LocalItem, e: React.DragEvent) {
    dragRef.current = { id: item.id, group: item.group };
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(item: LocalItem, e: React.DragEvent) {
    // Only allow drops within the same group
    if (!dragRef.current || dragRef.current.group !== item.group) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(item.id);
  }

  function handleDrop(item: LocalItem, e: React.DragEvent) {
    e.preventDefault();
    const from = dragRef.current;
    if (!from || from.group !== item.group || from.id === item.id) {
      setDragOverId(null);
      return;
    }
    const group = item.group;
    setLocalGroups((prev) => {
      const items = [...prev[group]];
      const fromIdx = items.findIndex((q) => q.id === from.id);
      const toIdx = items.findIndex((q) => q.id === item.id);
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      // Commit reorder to context immediately
      reorderQueriesInGroup(
        group,
        items.map((q) => q.id),
      );
      return { ...prev, [group]: items };
    });
    setDragOverId(null);
  }

  function handleDragEnd() {
    dragRef.current = null;
    setDragOverId(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Queries</DialogTitle>
          <DialogDescription>
            Run, reorder, or toggle queries. Drag to reorder within a group.
            Remove is available for saved queries only.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="pr-0" onClick={() => setPendingDeleteId(null)}>
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-5">
            {GROUP_ORDER.map((group) => {
              const items = localGroups[group];
              if (!items.length) return null;
              return (
                <section key={group}>
                  <p className="text-muted-foreground mb-1 px-1 text-xs font-medium uppercase tracking-wide">
                    {GROUP_LABELS[group]}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(item, e)}
                        onDragOver={(e) => handleDragOver(item, e)}
                        onDrop={(e) => handleDrop(item, e)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-1.5 py-2 transition-opacity",
                          !item.enabled && "opacity-40",
                          dragOverId === item.id && "border-primary border-t-2",
                        )}
                      >
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={() => handleToggle(item)}
                          aria-label={
                            item.enabled ? "Disable query" : "Enable query"
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">
                            {item.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {item.group === "user-query" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "size-7",
                                pendingDeleteId === item.id
                                  ? "text-destructive hover:text-destructive"
                                  : "text-muted-foreground",
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                              aria-label={
                                pendingDeleteId === item.id
                                  ? "Confirm delete"
                                  : "Delete query"
                              }
                            >
                              <LuSquareMinus className="size-3.5" />
                            </Button>
                          )}
                          <RiDraggable className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleRun(item.id)}
                            aria-label="Run query"
                          >
                            <LuSquarePlay className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {pendingDeleteId && (
            <p className="text-destructive mt-3 text-center text-xs p-1.5 border border-destructive rounded mr-5">
              Click the trash icon again to confirm deletion.
            </p>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
