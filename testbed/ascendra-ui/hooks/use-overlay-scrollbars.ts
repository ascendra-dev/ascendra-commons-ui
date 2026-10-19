'use client';

import * as React from 'react';
import { OverlayScrollbars, type PartialOptions } from 'overlayscrollbars';
import 'overlayscrollbars/overlayscrollbars.css';
import './overlay-scrollbars.css';

type Overflow = NonNullable<PartialOptions['overflow']>;

/**
 * Script-drawn scrollbars that float over the content — no gutter beside it — on every device, touch included:
 * a 4px thumb in a 10px grab area, stopping 12px short of each end, shown only while scrolling (theme in
 * overlay-scrollbars.css).
 *
 * `host` is a non-scrolling wrapper the scrollbars are appended to; `viewport` is its only child, the element
 * that actually scrolls. Both stay React-rendered — the library adopts the viewport rather than generating
 * one, so scrollTop/scroll listeners on it keep working. `overflow` replaces the viewport's CSS overflow.
 */
export function useOverlayScrollbars(
  host: React.RefObject<HTMLElement | null>,
  viewport: React.RefObject<HTMLElement | null>,
  { x = 'hidden', y = 'hidden', enabled = true }: Overflow & { enabled?: boolean }
) {
  React.useEffect(() => {
    if (!enabled || !host.current || !viewport.current) return;
    const instance = OverlayScrollbars(
      { target: host.current, elements: { viewport: viewport.current } },
      {
        overflow: { x, y },
        scrollbars: { theme: 'os-theme-ascendra', autoHide: 'scroll', autoHideDelay: 800, clickScroll: true },
      }
    );
    return () => instance.destroy();
  }, [host, viewport, x, y, enabled]);
}
