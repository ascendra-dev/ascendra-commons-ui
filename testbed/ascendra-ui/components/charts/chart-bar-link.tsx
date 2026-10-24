"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rectangle, type RectangleProps } from "recharts";

import { flashElement, useCardContext } from "@/ascendra-ui/components/card/card";

type ChartBarLinkProps<T> = {
  /** Where this bar's column goes — from its data row; `undefined` leaves the column plain. */
  href: (row: T) => string | undefined;
  /** Supplied by Recharts when this is a `<Bar shape={…}>`. */
  payload?: T;
  background?: { x?: number; y?: number; width?: number; height?: number };
} & Omit<RectangleProps, "ref" | "href">;

/**
 * Makes a bar chart's column a real link — the browser shows where it goes, cmd/middle-click open a new tab. Pass it
 * as a `<Bar>`'s `shape`; it draws the bar as usual and lays a transparent link over the column's full height, so a
 * click anywhere in the day (an empty one too) goes there, as a chart-level `onClick` did. A plain click navigates in
 * the app (`router.push`), so app state such as an open toast survives. On a stacked chart, give it to the top
 * series only — that one's column covers the stack. The chart's tooltip is unaffected. Not a Tab stop: a chart has
 * one per bar.
 *
 * In a maximized card (which is for reading) a column doesn't leave: a click brings the card back, then tints that
 * column — the next click goes there, in context.
 */
export function ChartBarLink<T>({ href, payload, background, ...bar }: ChartBarLinkProps<T>) {
  const router = useRouter();
  const { maximized, restore, restoredMark, markRestored } = useCardContext();
  const columnRef = React.useRef<SVGRectElement>(null);
  const url = payload ? href(payload) : undefined;
  const marked = !!url && restoredMark === url;
  // Tinted from here, not from the click: the chart redraws its shapes as the card shrinks back, and a fresh one
  // still finds the mark.
  React.useEffect(() => {
    if (marked && columnRef.current) flashElement(columnRef.current);
  }, [marked]);
  const drawn = bar.height ? <Rectangle {...bar} /> : null;
  if (!url || !background) return drawn;
  const column = (
    <rect
      ref={columnRef}
      x={background.x}
      y={background.y}
      width={background.width}
      height={background.height}
      fill="transparent"
    />
  );

  if (maximized) {
    return (
      <g
        data-slot="chart-bar-link"
        data-href={url}
        className="cursor-pointer"
        // Focus stays on the card — a chart layer that took it would draw its outline once the card is back.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => restore(() => markRestored(url))}
      >
        {drawn}
        {column}
      </g>
    );
  }

  return (
    <a
      href={url}
      tabIndex={-1}
      data-slot="chart-bar-link"
      className="cursor-pointer outline-none"
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        router.push(url);
      }}
    >
      {drawn}
      {column}
    </a>
  );
}
