"use client";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";

/**
 * A table in a card's body, in place of a CardPanel: the card's header (title, subtitle) above, the table's own
 * column header and raised rows, a CardFooter below. It collapses with the card like a panel does — and as with a
 * panel, the footer's separator shows only while it's collapsed. Put a Table and its loading/empty/error bodies in it.
 */
export function CardTable({ className, children, ...props }: React.ComponentProps<"div">) {
  const { collapseable, collapsed, maximized } = useCardContext();
  const isCollapsed = collapseable && collapsed;
  return (
    <div
      data-slot="card-table"
      data-section-body
      data-collapsed={isCollapsed ? "true" : "false"}
      inert={isCollapsed}
      className={cn(
        "grid transition-all duration-300",
        // Filling the screen: the table takes the rest of the card's height and scrolls.
        maximized && "min-h-0 flex-1",
        isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        className,
      )}
      {...props}
    >
      {/* Clips while it folds; the -m-2/p-2 leaves the table frame's ring and shadow 8px of room (as CardPanel does). */}
      <div
        className={cn(
          "-m-2 flex min-h-0 flex-col overflow-hidden p-2 transition-all duration-300",
          isCollapsed && "m-0 p-0",
          maximized && "overflow-y-auto",
        )}
      >
        {children}
      </div>
    </div>
  );
}
