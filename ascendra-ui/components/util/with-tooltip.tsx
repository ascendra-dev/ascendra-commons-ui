'use client';

import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@/ascendra-ui/shadcn';

export interface WithTooltipProps {
  /** Content shown inside the tooltip on hover/focus. */
  tooltip: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps arbitrary `children` — plain text, a Fragment with multiple nodes,
 * a custom component, anything — in a hoverable tooltip. Renders its own
 * `<span>` as the `asChild` trigger target, so Radix's Slot always has the
 * single ref-forwardable element it needs, regardless of what's passed in.
 */
export function WithTooltip({ tooltip, children, className }: WithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span data-slot="with-tooltip" className={cn('inline-block', className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
