"use client";

import React, { createContext, useContext, useRef, useState } from "react";

import { cn } from "@/ascendra-ui/shadcn";
import {
  buildBorderClasses,
  type BorderConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import { MaximizeBackdrop, MaximizeProvider, useMaximize } from "@/ascendra-ui/components/ui/maximize";

type CardContextValue = {
  collapseable: boolean;
  collapsed: boolean;
  onToggle: () => void;
  step?: number;
  /** Shows a maximize toggle in the CardHeader. */
  maximizable: boolean;
  /** Filling the screen — a list or table shows every row, the body scrolls. */
  maximized: boolean;
  onToggleMaximize: () => void;
};

const CardContext = createContext<CardContextValue>({
  collapseable: false,
  collapsed: false,
  onToggle: () => {},
  step: undefined,
  maximizable: false,
  maximized: false,
  onToggleMaximize: () => {},
});

export function useCardContext() {
  return useContext(CardContext);
}

/**
 * `collapseable` — a click on the header folds the body (its chevron says which way). `maximizable` — the header gets a
 * maximize toggle: the card fills the screen over a light overlay, in place (see useMaximize). Maximized it's for
 * reading: a row or chart link that would leave the page brings the card back instead, a list or table shows every
 * row, and a chart takes the card's height. A maximizable card inside it (or a maximizable page around a card that
 * holds one) — only the innermost maximizes.
 */
export function Card({
  danger = false,
  collapseable,
  maximizable,
  hasError = false,
  step,
  border,
  inverse = false,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  danger?: boolean;
  collapseable?: "expanded" | "collapsed";
  maximizable?: boolean;
  hasError?: boolean;
  step?: number;
  border?: BorderConfig;
  inverse?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(collapseable === "collapsed");
  const ref = useRef<HTMLElement>(null);
  const max = useMaximize(ref, { enabled: !!maximizable, name: "Card" });
  const { maximized } = max;

  const folded = !!collapseable && collapsed && !maximized;

  return (
    <CardContext.Provider
      value={{
        collapseable: !!collapseable,
        collapsed: collapsed && !maximized,
        onToggle: () => setCollapsed((prev) => !prev),
        step,
        maximizable: max.canMaximize,
        maximized,
        onToggleMaximize: max.toggle,
      }}
    >
      <MaximizeBackdrop state={max} slot="card" />
      <section
        ref={ref}
        data-slot="card"
        data-maximized={maximized || undefined}
        role={maximized ? "dialog" : undefined}
        aria-modal={maximized || undefined}
        tabIndex={maximized ? -1 : undefined}
        className={cn(
          "group bg-muted flex flex-col rounded-xl pb-1 has-data-[slot=card-header]:pt-1",
          danger && "bg-red-50 dark:bg-(--color-red-1500)",
          // Folded, it hugs its header and footer — not stretched to a taller neighbour in a grid or flex row. Height
          // only: self-start would also shrink its width in a flex column.
          folded && "h-fit",
          hasError &&
            collapsed &&
            "outline-2 -outline-offset-2 outline-destructive",
          border && buildBorderClasses(border),
          inverse && "dark",
          className,
          // Focused only programmatically (maximized, and just after) — never a ring.
          "focus:outline-none",
          // Last, over a className's height or width: the screen, above the top bars and the slide-in sidebar.
          maximized && [
            "fixed inset-4 z-190 h-auto max-h-none w-auto shadow-2xl outline-none sm:inset-8",
            // Dark only: a hairline keeps the edge readable over the dimmed page (light has its shadow for that).
            "dark:ring-1 dark:ring-white/12",
            // A chart takes the card's height (a fixed h-56 would only widen) — every box between the body and the
            // chart fills its parent, and the chart keeps at least its usual 14rem.
            "[&_[data-slot=card-panel-body]_:has([data-slot=chart])]:h-full",
            "[&_[data-slot=card-panel-body]_[data-slot=chart]]:h-full [&_[data-slot=card-panel-body]_[data-slot=chart]]:min-h-56",
          ],
        )}
        {...props}
      >
        <MaximizeProvider state={max}>{children}</MaximizeProvider>
      </section>
    </CardContext.Provider>
  );
}
