'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { differenceInCalendarDays, format, isSameDay } from 'date-fns';
import { type DateRange, type Matcher } from 'react-day-picker';
import { type CalendarProps } from '@/ascendra-ui/components/date/calendar';
import { LuCalendar } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';
import { PopupLayer, usePopupTopInset, usePopupZIndex } from '@/ascendra-ui/components/ui/popup-layer';
import { scrollCalendarIntoRoom } from '@/ascendra-ui/components/date/scroll-calendar-into-room';
import { Calendar } from '@/ascendra-ui/components/date/calendar';
import { boundsMatchers } from '@/ascendra-ui/components/date/bounds-matchers';
import { clearOnKey, PickerClearButton } from '@/ascendra-ui/components/date/picker-clear-button';
import { EditableDateField, pickerFieldClass } from '@/ascendra-ui/components/date/picker-field';
import { DEFAULT_DATE_FORMAT, formatHint, formatRangeText, parseRangeText } from '@/ascendra-ui/components/date/date-text';

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
  /** Show a × while a value is set (Backspace/Delete on the trigger too) — clears to undefined. */
  showClear?: boolean;
  /**
   * Type the range as well as pick it, in one field ("14/07/2026 – 11/10/2026"; any text between the
   * two dates works). Committed on blur/Enter; one date is a start-only range, an end typed first is
   * swapped, unreadable text reverts to the last value, empty text clears.
   */
  editable?: boolean;
  /** date-fns pattern typed and shown when `editable`. Default 'dd/MM/yyyy'; `/`, `-` or `.` all accepted. */
  dateFormat?: string;
}

/** Gap between the field and its calendar. */
const CALENDAR_OFFSET = 6;

function DateRangePicker({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
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
  showClear = false,
  editable = false,
  dateFormat = DEFAULT_DATE_FORMAT,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const z = usePopupZIndex();
  const topInset = usePopupTopInset();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const clearVisible = showClear && !!value?.from && !readOnly && !disabled;
  const clear = () => onChange?.(undefined);

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
        // One frame on, the calendar has rendered and can be measured.
        else requestAnimationFrame(() => contentRef.current && scrollCalendarIntoRoom(contentRef.current, topInset, CALENDAR_OFFSET));
      }}
    >
      {editable ? (
        <EditableDateField
          id={id}
          slot="date-range-picker-trigger"
          label={label}
          placeholder={placeholder ?? 'Pick a date range'}
          committedText={formatRangeText(value, dateFormat)}
          editPlaceholder={`${formatHint(dateFormat)} – ${formatHint(dateFormat)}`}
          editLabel="Type date range"
          onCommitText={(text) => {
            const parsed = parseRangeText(text, dateFormat);
            if (parsed !== 'invalid') onChange?.(parsed);
          }}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          invalid={invalid}
          className={className}
          clearVisible={clearVisible}
          onClear={clear}
        />
      ) : (
        <PopoverPrimitive.Trigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-invalid={invalid || undefined}
            onKeyDown={clearOnKey(clearVisible, clear)}
            data-slot="date-range-picker-trigger"
            className={cn(pickerFieldClass({ invalid, readOnly, empty: !label }), className)}
          >
            <LuCalendar className="text-muted-foreground size-4 shrink-0" />
            <span className="min-w-0 truncate">{label ?? placeholder ?? 'Pick a date range'}</span>
            {clearVisible && <PickerClearButton onClear={clear} />}
          </button>
        </PopoverPrimitive.Trigger>
      )}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={CALENDAR_OFFSET}
          collisionPadding={{ top: topInset }}
          ref={contentRef}
          style={{ zIndex: z }}
          className={cn(
            'overflow-hidden rounded-xl',
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
          <PopupLayer z={z}>
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
          </PopupLayer>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DateRangePicker };
export type { DateRange };
