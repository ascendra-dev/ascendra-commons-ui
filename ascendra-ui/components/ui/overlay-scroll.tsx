'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { useOverlayScrollbars } from '@/ascendra-ui/hooks/use-overlay-scrollbars';

type Overflow = 'scroll' | 'hidden';

/**
 * A scroll area with the library's floating scrollbars (see useOverlayScrollbars) — for content that mounts
 * later, like a popup's panel, and for any new scroll area. `className` styles the outer box (size, max-height,
 * border, rounding); the inner scrolling element has its padding reset by the library, so put padding on the
 * children, or on the box around this.
 */
function OverlayScroll({
  x = 'hidden',
  y = 'scroll',
  className,
  viewportClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & { x?: Overflow; y?: Overflow; viewportClassName?: string }) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  useOverlayScrollbars(hostRef, viewportRef, { x, y });

  return (
    <div ref={hostRef} data-slot="overlay-scroll" className={cn('min-h-0', className)} {...props}>
      <div
        ref={viewportRef}
        // hides the native scrollbar until useOverlayScrollbars takes over
        data-overlayscrollbars-initialize=""
        className={cn(x === 'scroll' && 'overflow-x-auto', y === 'scroll' && 'overflow-y-auto', viewportClassName)}
      >
        {children}
      </div>
    </div>
  );
}

export { OverlayScroll };
