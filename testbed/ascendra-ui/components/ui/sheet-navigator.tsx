'use client';

import * as React from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';

export interface SheetNavigatorProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Zero-based position of the item the sheet is showing. */
  index: number;
  count: number;
  onIndexChange: (index: number) => void;
  /** ArrowUp / ArrowDown step through the items while mounted. */
  keyboard?: boolean;
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * Previous / next stepper for a Sheet that shows one item of a list. Sits beside SheetContent's
 * close button by default; pass className to place it elsewhere.
 */
export function SheetNavigator({
  index,
  count,
  onIndexChange,
  keyboard = true,
  className,
  ...props
}: SheetNavigatorProps) {
  const hasPrevious = index > 0;
  const hasNext = index < count - 1;

  function step(delta: -1 | 1) {
    const next = index + delta;
    if (next >= 0 && next < count) onIndexChange(next);
  }
  const onArrowKey = React.useEffectEvent(step);

  React.useEffect(() => {
    if (!keyboard) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditable(event.target)) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      onArrowKey(event.key === 'ArrowUp' ? -1 : 1);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [keyboard]);

  const buttonClass =
    'text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 transition-colors disabled:pointer-events-none disabled:opacity-40';

  return (
    <div
      data-slot="sheet-navigator"
      className={cn('absolute top-4 right-11 flex items-center gap-0.5', className)}
      {...props}
    >
      <button
        type="button"
        data-slot="sheet-navigator-previous"
        aria-label="Previous"
        disabled={!hasPrevious}
        onClick={() => step(-1)}
        className={buttonClass}
      >
        <LuChevronUp className="size-4" />
      </button>
      <span data-slot="sheet-navigator-position" className="text-muted-foreground px-1 text-xs tabular-nums">
        {index + 1} of {count}
      </span>
      <button
        type="button"
        data-slot="sheet-navigator-next"
        aria-label="Next"
        disabled={!hasNext}
        onClick={() => step(1)}
        className={buttonClass}
      >
        <LuChevronDown className="size-4" />
      </button>
    </div>
  );
}
