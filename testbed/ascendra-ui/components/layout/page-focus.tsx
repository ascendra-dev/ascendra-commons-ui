"use client";

import * as React from "react";
import { LuMaximize2, LuMinimize2 } from "react-icons/lu";

import { cn } from "@/ascendra-ui/shadcn";
import { Button } from "@/ascendra-ui/components/ui/button";
import { MaximizeBackdrop, MaximizeProvider, useMaximize } from "@/ascendra-ui/components/ui/maximize";
import { useOverlayScrollbars } from "@/ascendra-ui/hooks/use-overlay-scrollbars";
import "./page-focus.css";

const PageFocusContext = React.createContext<{ canFocus: boolean; focused: boolean; toggle: () => void } | null>(
  null,
);

/** The DataTables in a PageFocus register here; with exactly one, a focused page fills the screen around it. */
const PageTableContext = React.createContext<{ register: () => () => void; fill: boolean } | null>(null);

/**
 * Focus mode for a page: wraps its PageHeader and PageMain, and a PageFocusToggle in the header fills the screen with
 * them over a light overlay — in place, the same elements, so a table's query, filters and page survive (see
 * useMaximize). Focused, it scrolls inside itself, it's for reading — a row or chart link that would leave the page
 * brings the page back instead — and the title's back arrow hides. Leave a BackLink outside it.
 *
 * With one DataTable, focused, the page is compact: a column the screen's height — the title, query bar and toolbar
 * keep theirs, the table takes the rest and scrolls its rows (its column header stays, its footer sits at the bottom).
 * The rules are in page-focus.css; on a screen too short for that, the whole page scrolls instead. Focused, any page is
 * compact too: tighter padding and gaps, no subtitle or separator, a smaller title.
 *
 * A page holding a maximizable Card can't be focused (no stacking) — the toggle doesn't show, and development warns.
 */
export function PageFocus({ className, children, ...props }: React.ComponentProps<"section">) {
  const ref = React.useRef<HTMLElement>(null);
  const max = useMaximize(ref, { enabled: true, name: "PageFocus" });
  const { maximized: focused } = max;
  const hostRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  // On a wrapper, not the section — the scrollbars make their host `position: relative`, which would undo `fixed`.
  useOverlayScrollbars(hostRef, viewportRef, { y: "scroll", enabled: focused });
  const [tables, setTables] = React.useState(0);
  const register = React.useCallback(() => {
    setTables((n) => n + 1);
    return () => setTables((n) => n - 1);
  }, []);
  const fill = focused && tables === 1;
  const tableValue = React.useMemo(() => ({ register, fill }), [register, fill]);
  const value = React.useMemo(
    () => ({ canFocus: max.canMaximize, focused, toggle: max.toggle }),
    [max.canMaximize, focused, max.toggle],
  );

  return (
    <PageFocusContext.Provider value={value}>
      <MaximizeBackdrop state={max} slot="page-focus" />
      <section
        ref={ref}
        data-slot="page-focus"
        data-focused={focused || undefined}
        role={focused ? "dialog" : undefined}
        aria-modal={focused || undefined}
        aria-label={focused ? "Focus mode" : undefined}
        tabIndex={focused ? -1 : undefined}
        className={cn(
          // Focused only programmatically (focused, and just after) — never a ring.
          "focus:outline-none",
          className,
          // The screen, above the top bars and the slide-in sidebar — as a maximized Card.
          focused && "bg-background fixed inset-4 z-190 rounded-xl shadow-2xl sm:inset-8 dark:ring-1 dark:ring-white/12",
        )}
        {...props}
      >
        {/* Always rendered, so focusing never remounts the page; it scrolls only while focused. */}
        <div ref={hostRef} className={cn(focused && "h-full")}>
          <div
            ref={viewportRef}
            data-slot="page-focus-viewport"
            // hides the native scrollbar until useOverlayScrollbars takes over
            data-overlayscrollbars-initialize={focused ? "" : undefined}
            className={cn(focused && "h-full overflow-y-auto")}
          >
            {/* Padding here — the scrollbars take over the viewport's own. Compact (see page-focus.css). */}
            <div data-page-fill={fill || undefined} className={cn(focused && "p-4")}>
              <PageTableContext.Provider value={tableValue}>
                <MaximizeProvider state={max}>{children}</MaximizeProvider>
              </PageTableContext.Provider>
            </div>
          </div>
        </div>
      </section>
    </PageFocusContext.Provider>
  );
}

/** For DataTable: registers it with the PageFocus around (if any); true while that page fills the screen around it. */
export function usePageFillTable() {
  const ctx = React.useContext(PageTableContext);
  const register = ctx?.register;
  React.useEffect(() => register?.(), [register]);
  return ctx?.fill ?? false;
}

/** Whether the page around is focused — false outside a PageFocus. */
export function usePageFocused() {
  return React.useContext(PageFocusContext)?.focused ?? false;
}

/**
 * The focus-mode toggle — an icon button; put it last in the PageHeaderAction, so it sits far right. Nothing outside a
 * PageFocus, or when the page can't be focused.
 */
export function PageFocusToggle({ className, ...props }: Omit<React.ComponentProps<typeof Button>, "children">) {
  const ctx = React.useContext(PageFocusContext);
  if (!ctx?.canFocus) return null;
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      data-slot="page-focus-toggle"
      aria-label={ctx.focused ? "Exit focus mode" : "Focus mode"}
      aria-pressed={ctx.focused}
      onClick={ctx.toggle}
      className={className}
      {...props}
    >
      {ctx.focused ? <LuMinimize2 className="size-3.5" /> : <LuMaximize2 className="size-3.5" />}
    </Button>
  );
}
