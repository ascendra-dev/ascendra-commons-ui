"use client";

import * as React from "react";
import { createPortal, flushSync } from "react-dom";

import { cn } from "@/ascendra-ui/shadcn";
import { maximizeOverlayClasses } from "@/ascendra-ui/components/ui/overlay-styles";
import { MaximizedPopupLayer } from "@/ascendra-ui/components/ui/popup-layer";

/**
 * What a link inside a maximized element (a Card, a PageFocus) needs: whether it's maximized, and how to bring it
 * back. Maximized is for reading — a link that would leave the page calls `restore` instead, and the link then waits
 * in context for a second click.
 */
export type MaximizeScope = {
  maximized: boolean;
  /** Brings the element back, then calls `then` once it's in its place. */
  restore: (then?: () => void) => void;
  /**
   * What a restored element marks for a moment (`markRestored`) — a chart column reads it and tints itself, which
   * survives the chart redrawing its shapes as it shrinks back.
   */
  restoredMark?: string;
  markRestored: (key: string) => void;
};

const ScopeContext = React.createContext<MaximizeScope>({
  maximized: false,
  restore: (then) => then?.(),
  markRestored: () => {},
});

/** Registers a maximizable element with the maximizable one around it — see useMaximize. */
const NestContext = React.createContext<(() => () => void) | null>(null);

/** The nearest maximizable element around this one (a Card, a PageFocus) — inert outside any. */
export function useMaximizeScope() {
  return React.useContext(ScopeContext);
}

const FLASH_MS = 1600;

/**
 * A brief tint over what a restored element's link pointed at — a row, a chart column — so the eye finds it again.
 * An SVG shape tints its fill, anything else its background.
 */
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
 * Maximize, in place: the element (`ref`, the caller's — kept out of the returned state, which is passed around while
 * rendering) goes fixed over a light overlay — the same element, so nothing inside it
 * remounts or loses its state — while a placeholder holds its spot (MaximizeBackdrop). Esc (with focus inside it, so
 * a sheet or menu opened from it closes first) or a click on the overlay brings it back; the page behind doesn't
 * scroll meanwhile. Where the browser has View Transitions it grows from where it was and shrinks back.
 *
 * No stacking: a maximizable element inside another one makes the outer one not maximizable (`canMaximize` false,
 * with a console warning in development) — only the innermost keeps the toggle.
 */
export function useMaximize(
  ref: React.RefObject<HTMLElement | null>,
  { enabled, name }: { enabled: boolean; name: string },
) {
  const [maximized, setMaximized] = React.useState(false);
  const [placeholderHeight, setPlaceholderHeight] = React.useState<number>();
  const [restoredMark, setRestoredMark] = React.useState<string>();
  const [nested, setNested] = React.useState(0);
  const transitionName = `maximize-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  // Tell the maximizable element around this one that it holds one.
  const registerWithOuter = React.useContext(NestContext);
  React.useEffect(() => (enabled && registerWithOuter ? registerWithOuter() : undefined), [enabled, registerWithOuter]);
  const registerNested = React.useCallback(() => {
    setNested((n) => n + 1);
    return () => setNested((n) => n - 1);
  }, []);
  const holdsMaximizable = nested > 0;
  React.useEffect(() => {
    if (enabled && holdsMaximizable && process.env.NODE_ENV !== "production") {
      console.warn(
        `${name} is maximizable but holds a maximizable element — it won't maximize (no stacking). Remove one of them.`,
      );
    }
  }, [enabled, holdsMaximizable, name]);

  const setMaximize = React.useCallback(
    (next: boolean, then?: () => void) => {
      const el = ref.current;
      const apply = () => {
        flushSync(() => {
          if (next && el) setPlaceholderHeight(el.getBoundingClientRect().height);
          setMaximized(next);
        });
        if (!el) return;
        // Maximized, focus moves to the element (no ring) — Esc and a screen reader start there. Back, a focus left on
        // it or dropped stays on it, still no ring (on a toggle, Esc being a key would draw one), and Tab goes on from
        // there; it's focusable only until focus leaves it.
        if (next) el.focus({ preventScroll: true });
        else if (document.activeElement === el || document.activeElement === document.body) {
          el.tabIndex = -1;
          el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
          el.focus({ preventScroll: true });
        }
      };
      const doc = document as ViewTransitionDocument;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!el || !doc.startViewTransition || reduceMotion) {
        apply();
        then?.();
        return;
      }
      // Named only while it moves, so two elements never share a name.
      el.style.viewTransitionName = transitionName;
      doc.startViewTransition(apply).finished.finally(() => {
        el.style.viewTransitionName = "";
        then?.();
      });
    },
    [ref, transitionName],
  );
  const toggle = React.useCallback(() => setMaximize(!maximized), [maximized, setMaximize]);
  const restore = React.useCallback((then?: () => void) => setMaximize(false, then), [setMaximize]);
  const markRestored = React.useCallback((key: string) => setRestoredMark(key), []);

  React.useEffect(() => {
    if (!restoredMark) return;
    const timer = setTimeout(() => setRestoredMark(undefined), FLASH_MS);
    return () => clearTimeout(timer);
  }, [restoredMark]);

  // Maximized: Esc brings it back, and the page behind doesn't scroll.
  React.useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // A sheet, dialog or menu opened from inside has focus outside the element — that Esc is theirs.
      const target = e.target as Node;
      if (target !== document.body && !ref.current?.contains(target)) return;
      toggle();
    };
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
    };
  }, [ref, maximized, toggle]);

  const scope = React.useMemo<MaximizeScope>(
    () => ({ maximized, restore, restoredMark, markRestored }),
    [maximized, restore, restoredMark, markRestored],
  );

  return {
    enabled,
    canMaximize: enabled && !holdsMaximizable,
    maximized,
    toggle,
    restore,
    placeholderHeight,
    scope,
    registerNested,
  };
}

type MaximizeState = ReturnType<typeof useMaximize>;

/**
 * The element's children: when maximizable, links inside see it as their scope, maximizable elements inside register
 * with it, and while maximized popups opened inside show above it. Not maximizable, it passes the outer ones through.
 */
export function MaximizeProvider({ state, children }: { state: MaximizeState; children?: React.ReactNode }) {
  if (!state.enabled) return <>{children}</>;
  return (
    <ScopeContext.Provider value={state.scope}>
      <NestContext.Provider value={state.registerNested}>
        <MaximizedPopupLayer active={state.maximized}>{children}</MaximizedPopupLayer>
      </NestContext.Provider>
    </ScopeContext.Provider>
  );
}

/** Rendered just before the element: while it's maximized, a placeholder holding its spot and the overlay. */
export function MaximizeBackdrop({ state, slot }: { state: MaximizeState; slot: string }) {
  if (!state.maximized) return null;
  return (
    <>
      <div data-slot={`${slot}-placeholder`} aria-hidden style={{ height: state.placeholderHeight }} />
      {createPortal(
        <div
          data-slot={`${slot}-maximize-overlay`}
          aria-hidden
          onClick={state.toggle}
          className={cn("fixed inset-0 z-189", ...maximizeOverlayClasses)}
        />,
        document.body,
      )}
    </>
  );
}
