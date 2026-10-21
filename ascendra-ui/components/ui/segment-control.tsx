'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';

export interface Segment {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentControlContextValue {
  value: string;
  select: (value: string) => void;
  size: 'sm' | 'default';
  disabled?: boolean;
}

const SegmentControlContext = React.createContext<SegmentControlContextValue | null>(null);

function useSegmentControl() {
  const context = React.useContext(SegmentControlContext);
  if (!context) throw new Error('SegmentControlItem must be used inside <SegmentControl>');
  return context;
}

/**
 * One choice out of a few, all visible at once — a period (Past hour / 24 hours / 7 days), a view mode. A radio group:
 * the chosen segment is raised on a muted track, arrow keys move between segments. For switching between whole
 * panels of content use Tabs instead; this picks a value the page reads.
 *
 * Pass `segments` for plain labels; compose SegmentControlItem children instead for custom content (icons, counts).
 */
function SegmentControl({
  segments,
  value: valueProp,
  defaultValue,
  onValueChange,
  size = 'default',
  disabled,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  /** The segments, in order — each rendered as a SegmentControlItem. Omit to compose items as children. */
  segments?: readonly Segment[];
  /** The chosen segment (controlled). */
  value?: string;
  /** The initially chosen segment (uncontrolled). Defaults to the first of `segments`. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'default';
  disabled?: boolean;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? segments?.[0]?.value ?? '');
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolled;
  const ref = React.useRef<HTMLDivElement>(null);

  const select = (next: string) => {
    if (next === value) return;
    if (!isControlled) setUncontrolled(next);
    onValueChange?.(next);
  };

  // Arrow keys move the choice along (wrapping), as in a native radio group — and focus follows it.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step || disabled) return;
    const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)') ?? [])];
    const current = items.findIndex((item) => item.dataset.value === value);
    const target = items[(current + step + items.length) % items.length];
    if (!target?.dataset.value) return;
    e.preventDefault();
    select(target.dataset.value);
    target.focus();
  };

  return (
    <SegmentControlContext.Provider value={{ value, select, size, disabled }}>
      <div
        ref={ref}
        role="radiogroup"
        data-slot="segment-control"
        aria-disabled={disabled || undefined}
        className={cn(
          'bg-muted inline-flex w-fit items-center gap-0.5 rounded-[0.5rem] p-0.5',
          'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
          disabled && 'opacity-50',
          className,
        )}
        onKeyDown={onKeyDown}
        {...props}
      >
        {segments
          ? segments.map((segment) => (
              <SegmentControlItem key={segment.value} value={segment.value} disabled={segment.disabled}>
                {segment.label}
              </SegmentControlItem>
            ))
          : children}
      </div>
    </SegmentControlContext.Provider>
  );
}

function SegmentControlItem({
  value,
  disabled: disabledProp,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<'button'>, 'value' | 'type' | 'onClick'> & { value: string }) {
  const { value: chosen, select, size, disabled: disabledCtx } = useSegmentControl();
  const checked = chosen === value;
  const disabled = disabledProp ?? disabledCtx;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-slot="segment-control-item"
      data-state={checked ? 'checked' : 'unchecked'}
      data-value={value}
      disabled={disabled}
      // Only the chosen segment is a tab stop; arrow keys reach the rest (roving tabindex).
      tabIndex={checked ? 0 : -1}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all',
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-1',
        'disabled:cursor-not-allowed',
        size === 'sm' ? 'h-6 rounded-[0.3125rem] px-2.5 text-xs' : 'h-7 rounded-[0.375rem] px-3 text-sm',
        checked
          ? [
              'bg-secondary text-foreground cursor-default',
              // The secondary button's raised surface — the chosen segment reads as pressed out of the track.
              'shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]',
              'dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]',
            ]
          : 'text-muted-foreground hover:text-foreground cursor-pointer',
        className,
      )}
      onClick={() => select(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export { SegmentControl, SegmentControlItem };
