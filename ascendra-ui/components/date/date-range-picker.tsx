'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { differenceInCalendarDays, format, isSameDay } from 'date-fns';
import { type DateRange, type Matcher } from 'react-day-picker';
import { type CalendarProps } from '@/ascendra-ui/components/date/calendar';
import { LuCalendar } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';
import { Calendar } from '@/ascendra-ui/components/date/calendar';
import { boundsMatchers } from '@/ascendra-ui/components/date/bounds-matchers';

interface DateRangePickerProps {
  id?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  numberOfMonths?: number;
  /** Earliest selectable day; earlier days are disabled. */
  minDate?: Date;
  /** Latest selectable day; later days are disabled. */
  maxDate?: Date;
  /** Longest range in days, counting both ends — once a start is picked, days beyond it are disabled. */
  maxRangeDays?: number;
  captionLayout?: CalendarProps['captionLayout'];
}

function DateRangePicker({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'Pick a date range',
  disabled,
  readOnly,
  invalid,
  className,
  fromYear,
  toYear,
  numberOfMonths = 2,
  minDate,
  maxDate,
  maxRangeDays,
  captionLayout,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const disabledDays: Matcher[] = boundsMatchers(minDate, maxDate);
  const start = value?.from;
  // react-day-picker's first click sets both ends to that day, so a one-day selection is still
  // "picking the other end" — that's when days beyond the limit are disabled.
  const pickingEnd = start && (!value?.to || isSameDay(start, value.to));
  if (maxRangeDays && start && pickingEnd) {
    disabledDays.push((day: Date) => Math.abs(differenceInCalendarDays(day, start)) >= maxRangeDays);
  }

  const label = React.useMemo(() => {
    if (!value?.from) return null;
    if (!value.to) return format(value.from, 'MMM d, yyyy');
    return `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`;
  }, [value]);

  return (
    <PopoverPrimitive.Root
      open={readOnly ? false : open}
      onOpenChange={(next) => {
        if (readOnly) return;
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-slot="date-range-picker-trigger"
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-[.375rem] px-3 text-left text-sm transition',
            'ring-1',
            'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]',
            'dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            invalid && 'outline-2 outline-destructive outline-offset-1',
            !label && 'text-gray-500 dark:text-gray-700',
            readOnly ? [
              'bg-gray-100 dark:bg-white/5',
              'ring-gray-300 dark:ring-white/10',
              'shadow-none',
              'cursor-default',
              'focus-visible:outline-none',
            ] : [
              'bg-white dark:bg-secondary',
              'ring-(--color-umbra)/12 dark:ring-(--color-gray-1000)/88 dark:ring-inset',
              'hover:ring-(--color-umbra)/24',
              'focus-visible:outline-primary! focus-visible:outline-2! focus-visible:outline-offset-1!',
            ],
            className
          )}
        >
          <LuCalendar className="text-muted-foreground size-4 shrink-0" />
          {label ?? placeholder}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            'z-1001 overflow-hidden rounded-xl',
            'bg-white dark:bg-(--color-gray-1400)',
            'ring-1 ring-black/8 dark:ring-white/8',
            'shadow-[0_16px_36px_-6px_rgba(25,28,33,0.16),0_6px_16px_-2px_rgba(25,28,33,0.08)]',
            'dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.36),0_6px_16px_-2px_rgba(0,0,0,0.24)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            'duration-200'
          )}
        >
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            defaultMonth={value?.from}
            disabled={disabledDays}
            numberOfMonths={numberOfMonths}
            startMonth={
              fromYear !== undefined ? new Date(fromYear, 0) : undefined
            }
            endMonth={toYear !== undefined ? new Date(toYear, 11) : undefined}
            captionLayout={captionLayout}
            autoFocus
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DateRangePicker };
export type { DateRange };
