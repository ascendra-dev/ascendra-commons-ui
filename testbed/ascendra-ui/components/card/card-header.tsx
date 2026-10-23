"use client";

import { LuChevronDown } from "react-icons/lu";

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
  const { collapseable, collapsed, onToggle } = useCardContext();

  if (!collapseable) {
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
      <div className="flex items-center justify-between">
        <div>{children}</div>
        <button
          type="button"
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {/* A chevron — maximize/minimize icons are for a card that fills the screen, not one that folds. */}
          <LuChevronDown className={cn("size-4 transition-transform duration-300", !collapsed && "rotate-180")} />
        </button>
      </div>
    </header>
  );
}
