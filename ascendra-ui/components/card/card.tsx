"use client";

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import { cn } from "@/ascendra-ui/shadcn";
import {
  buildBorderClasses,
  type BorderConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import { maximizeOverlayClasses } from "@/ascendra-ui/components/ui/overlay-styles";
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
  /**
   * Brings a maximized card back, then calls `then` once it's in its place — what a link inside it does instead of
   * leaving the page: the card returns first, and the link waits in context for a second click.
   */
  restore: (then?: () => void) => void;
  /**
   * What a restored card marks for a moment (`markRestored`) — a chart column reads it and tints itself, which
   * survives the chart redrawing its shapes as it shrinks back.
   */
  restoredMark?: string;
  markRestored: (key: string) => void;
};

const CardContext = createContext<CardContextValue>({
  collapseable: false,
  collapsed: false,
  onToggle: () => {},
  step: undefined,
  maximizable: false,
  maximized: false,
  onToggleMaximize: () => {},
  restore: () => {},
  markRestored: () => {},
});

export function useCardContext() {
  return useContext(CardContext);
}

/**
 * A brief tint over what a restored card's link pointed at — a row, a chart column — so the eye finds it again.
 * An SVG shape tints its fill, anything else its background.
 */
const FLASH_MS = 1600;

export function flashElement(el: Element) {
  const property = el instanceof SVGElement ? "fill" : "backgroundColor";
  el.animate(
    [{ [property]: "color-mix(in oklab, var(--primary) 18%, transparent)" }, { [property]: "transparent" }],
    { duration: FLASH_MS, easing: "ease-out" },
  );
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * `collapseable` — a click on the header folds the body (its chevron says which way). `maximizable` — the header gets a
 * maximize toggle: the card fills the screen over a light overlay, in place — the same element, so nothing inside it
 * remounts or loses its state — with a placeholder holding its spot. Esc or a click on the overlay brings it back.
 * Where the browser has View Transitions it grows from where it was and shrinks back. Maximized it's for reading:
 * a row or chart link that would leave the page brings the card back instead (see `restore`), and a chart takes the
 * card's height.
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
  const [restoredMark, setRestoredMark] = useState<string>();
  const ref = useRef<HTMLElement>(null);
  const transitionName = `card-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  const setMaximize = useCallback(
    (next: boolean, then?: () => void) => {
      const el = ref.current;
      const apply = () => {
        flushSync(() => {
          if (next && el) setPlaceholderHeight(el.getBoundingClientRect().height);
          setMaximized(next);
        });
        if (!el) return;
        // Maximized, focus moves to the card (no ring) — Esc and a screen reader start there. Back, a focus left on
        // the card or dropped goes to its maximize toggle.
        if (next) el.focus({ preventScroll: true });
        else if (document.activeElement === el || document.activeElement === document.body)
          el.querySelector<HTMLElement>("[data-slot=card-maximize]")?.focus({ preventScroll: true });
      };
      const doc = document as ViewTransitionDocument;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!el || !doc.startViewTransition || reduceMotion) {
        apply();
        then?.();
        return;
      }
      // Named only while it moves, so two cards never share a name.
      el.style.viewTransitionName = transitionName;
      doc.startViewTransition(apply).finished.finally(() => {
        el.style.viewTransitionName = "";
        then?.();
      });
    },
    [transitionName],
  );
  const toggleMaximize = useCallback(() => setMaximize(!maximized), [maximized, setMaximize]);
  const restore = useCallback((then?: () => void) => setMaximize(false, then), [setMaximize]);
  const markRestored = useCallback((key: string) => setRestoredMark(key), []);

  useEffect(() => {
    if (!restoredMark) return;
    const timer = setTimeout(() => setRestoredMark(undefined), FLASH_MS);
    return () => clearTimeout(timer);
  }, [restoredMark]);

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
        maximizable: !!maximizable,
        maximized,
        onToggleMaximize: toggleMaximize,
        restore,
        restoredMark,
        markRestored,
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
            className={cn("fixed inset-0 z-189", ...maximizeOverlayClasses)}
          />,
          document.body,
        )}
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
          // Last, over a className's height or width: the screen, above the top bars and the slide-in sidebar.
          maximized && [
            "fixed inset-4 z-190 h-auto max-h-none w-auto shadow-2xl outline-none sm:inset-8",
            // A chart takes the card's height (a fixed h-56 would only widen) — every box between the body and the
            // chart fills its parent, and the chart keeps at least its usual 14rem.
            "[&_[data-slot=card-panel-body]_:has([data-slot=chart])]:h-full",
            "[&_[data-slot=card-panel-body]_[data-slot=chart]]:h-full [&_[data-slot=card-panel-body]_[data-slot=chart]]:min-h-56",
          ],
        )}
        {...props}
      >
        <MaximizedPopupLayer active={maximized}>{children}</MaximizedPopupLayer>
      </section>
    </CardContext.Provider>
  );
}
