"use client";

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import { cn } from "@/ascendra-ui/shadcn";
import {
  buildBorderClasses,
  type BorderConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import { overlayClasses } from "@/ascendra-ui/components/ui/overlay-styles";
import { MaximizedPopupLayer } from "@/ascendra-ui/components/ui/popup-layer";

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

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * `collapseable` — the header gets a chevron that folds the body. `maximizable` (on by default for a collapseable
 * card) — the header also gets a maximize toggle: the card fills the screen over the page's overlay, in place — the same
 * element, so nothing inside it remounts or loses its state — with a placeholder holding its spot. Esc or a click on the
 * overlay brings it back. Where the browser has View Transitions it grows from where it was and shrinks back.
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
  const [maximized, setMaximized] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState<number>();
  const ref = useRef<HTMLElement>(null);
  const transitionName = `card-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const canMaximize = maximizable ?? !!collapseable;

  const toggleMaximize = useCallback(() => {
    const el = ref.current;
    const next = !maximized;
    const apply = () =>
      flushSync(() => {
        if (next && el) setPlaceholderHeight(el.getBoundingClientRect().height);
        setMaximized(next);
      });
    const doc = document as ViewTransitionDocument;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !doc.startViewTransition || reduceMotion) return apply();
    // Named only while it moves, so two cards never share a name.
    el.style.viewTransitionName = transitionName;
    doc.startViewTransition(apply).finished.finally(() => {
      el.style.viewTransitionName = "";
    });
  }, [maximized, transitionName]);

  // Maximized: Esc brings it back, and the page behind doesn't scroll.
  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) toggleMaximize();
    };
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
    };
  }, [maximized, toggleMaximize]);

  const folded = !!collapseable && collapsed && !maximized;

  return (
    <CardContext.Provider
      value={{
        collapseable: !!collapseable,
        collapsed: collapsed && !maximized,
        onToggle: () => setCollapsed((prev) => !prev),
        step,
        maximizable: canMaximize,
        maximized,
        onToggleMaximize: toggleMaximize,
      }}
    >
      {/* Holds the card's spot in the layout while it fills the screen. */}
      {maximized && <div data-slot="card-placeholder" aria-hidden style={{ height: placeholderHeight }} />}
      {maximized &&
        createPortal(
          <div
            data-slot="card-maximize-overlay"
            aria-hidden
            onClick={toggleMaximize}
            className={cn("fixed inset-0 z-189", ...overlayClasses)}
          />,
          document.body,
        )}
      <section
        ref={ref}
        data-slot="card"
        data-maximized={maximized || undefined}
        role={maximized ? "dialog" : undefined}
        aria-modal={maximized || undefined}
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
          // Last, over a className's height or width: the screen, above the top bars and the slide-in sidebar.
          maximized && "fixed inset-4 z-190 h-auto max-h-none w-auto shadow-2xl sm:inset-8",
        )}
        {...props}
      >
        <MaximizedPopupLayer active={maximized}>{children}</MaximizedPopupLayer>
      </section>
    </CardContext.Provider>
  );
}
