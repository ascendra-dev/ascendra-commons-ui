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

/** A ring for keyboard focus only — a mouse click (and the card moving once maximized) never draws one. */
const toggleClasses = cn(
  "text-muted-foreground hover:text-foreground cursor-pointer rounded-sm transition-[color,opacity]",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/** What a click on the header leaves alone — the header's own controls take their clicks. */
const INTERACTIVE = "button, a, input, select, textarea, [role=button], [role=checkbox], [role=switch], [role=menuitem]";

/**
 * A collapseable card folds on a click anywhere on its header (not on a control inside it, nor when text was being
 * selected); the chevron is the keyboard's way in. With `maximizable` too, only the maximize toggle shows at rest — the
 * chevron fades in beside it on hover or keyboard focus, and stays on a touch screen.
 */
export function CardHeader({
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<"header">) {
  const { collapseable, collapsed, onToggle, maximizable, maximized, onToggleMaximize } = useCardContext();

  if (!collapseable && !maximizable) {
    return (
      <header
        data-slot="card-header"
        className={cn(headerClasses, className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </header>
    );
  }

  // Folding a card that fills the screen means nothing — the chevron and the header click wait until it's back.
  const foldable = collapseable && !maximized;

  return (
    <header
      data-slot="card-header"
      className={cn(headerClasses, foldable && "group/header cursor-pointer", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!foldable || event.defaultPrevented) return;
        if ((event.target as Element).closest(INTERACTIVE)) return;
        if (window.getSelection()?.toString()) return;
        onToggle();
      }}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">{children}</div>
        <div className="flex shrink-0 items-center gap-2">
          {foldable && (
            <button
              type="button"
              data-slot="card-collapse"
              aria-label={collapsed ? "Expand section" : "Collapse section"}
              aria-expanded={!collapsed}
              onClick={onToggle}
              className={cn(
                toggleClasses,
                maximizable &&
                  "opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
              )}
            >
              {/* A chevron — maximize/minimize icons are for a card that fills the screen, not one that folds. */}
              <LuChevronDown className={cn("size-4 transition-transform duration-300", !collapsed && "rotate-180")} />
            </button>
          )}
          {maximizable && (
            <button
              type="button"
              data-slot="card-maximize"
              aria-label={maximized ? "Restore section" : "Maximize section"}
              onClick={onToggleMaximize}
              className={toggleClasses}
            >
              {maximized ? <LuMinimize2 className="size-3.5" /> : <LuMaximize2 className="size-3.5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
