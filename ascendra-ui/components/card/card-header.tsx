"use client";

import { LuChevronDown, LuMaximize2, LuMinimize2 } from "react-icons/lu";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";

/** Over an open CardTable, a line under the header (the table's column header sits in the same grey); folded, none —
 *  the footer's separator divides them then. */
const headerClasses = cn(
  "px-6 py-4",
  "border-border group-has-[>[data-slot=card-table][data-collapsed=false]]:border-b",
);

export function CardHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  const { collapseable, collapsed, onToggle, maximizable, maximized, onToggleMaximize } = useCardContext();

  if (!collapseable && !maximizable) {
    return (
      <header
        data-slot="card-header"
        className={cn(headerClasses, className)}
        {...props}
      >
        {children}
      </header>
    );
  }

  return (
    <header
      data-slot="card-header"
      className={cn(headerClasses, className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">{children}</div>
        <div className="flex shrink-0 items-center gap-2">
          {maximizable && (
            <button
              type="button"
              aria-label={maximized ? "Restore section" : "Maximize section"}
              onClick={onToggleMaximize}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {maximized ? <LuMinimize2 className="size-3.5" /> : <LuMaximize2 className="size-3.5" />}
            </button>
          )}
          {/* Folding a card that fills the screen means nothing — the chevron waits until it's back. */}
          {collapseable && !maximized && (
            <button
              type="button"
              aria-label={collapsed ? "Expand section" : "Collapse section"}
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {/* A chevron — maximize/minimize icons are for a card that fills the screen, not one that folds. */}
              <LuChevronDown className={cn("size-4 transition-transform duration-300", !collapsed && "rotate-180")} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
