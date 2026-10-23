"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rectangle, type RectangleProps } from "recharts";

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
 */
export function ChartBarLink<T>({ href, payload, background, ...bar }: ChartBarLinkProps<T>) {
  const router = useRouter();
  const url = payload ? href(payload) : undefined;
  const drawn = bar.height ? <Rectangle {...bar} /> : null;
  if (!url || !background) return drawn;
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
      <rect x={background.x} y={background.y} width={background.width} height={background.height} fill="transparent" />
    </a>
  );
}
