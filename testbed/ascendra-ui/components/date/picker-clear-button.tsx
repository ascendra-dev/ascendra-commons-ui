'use client';

import { LuX } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';

/**
 * The × a date picker trigger shows while `showClear` and a value is set — the same pointer-only
 * treatment as Select's (a trigger <button> can't nest another); Backspace/Delete on the trigger is
 * the keyboard path.
 */
export function PickerClearButton({ onClear, className }: { onClear: () => void; className?: string }) {
  return (
    <span
      data-slot="date-picker-clear"
      aria-hidden
      className={cn(
        'text-muted-foreground -m-0.5 ml-auto flex cursor-pointer items-center justify-center rounded-sm p-0.5 hover:bg-black/5 dark:hover:bg-white/10',
        className
      )}
      // Keep the trigger from opening the calendar: stop the click before it reaches the trigger.
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClear();
      }}
    >
      <LuX className="pointer-events-none size-4" />
    </span>
  );
}

/** Backspace/Delete on a focused trigger clears it — the keyboard path for the ×. */
export function clearOnKey(clearVisible: boolean, onClear: () => void) {
  return (e: React.KeyboardEvent) => {
    if (clearVisible && !e.defaultPrevented && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      onClear();
    }
  };
}
