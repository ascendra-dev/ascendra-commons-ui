'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { format } from 'date-fns';
import { boundsMatchers } from '@/ascendra-ui/components/date/bounds-matchers';
import { clearOnKey, PickerClearButton } from '@/ascendra-ui/components/date/picker-clear-button';
import { EditableDateField, pickerFieldClass } from '@/ascendra-ui/components/date/picker-field';
import { DEFAULT_DATE_FORMAT, formatDateText, formatHint, parseDateText } from '@/ascendra-ui/components/date/date-text';
import { type CalendarProps } from '@/ascendra-ui/components/date/calendar';
import { LuCalendar } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';
import { PopupLayer, usePopupTopInset, usePopupZIndex } from '@/ascendra-ui/components/ui/popup-layer';
import { scrollCalendarIntoRoom } from '@/ascendra-ui/components/date/scroll-calendar-into-room';
import { Calendar } from '@/ascendra-ui/components/date/calendar';

interface DatePickerProps {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  /** Earliest selectable day; earlier days are disabled. */
  minDate?: Date;
  /** Latest selectable day; later days are disabled. */
  maxDate?: Date;
  captionLayout?: CalendarProps['captionLayout'];
  /** Show a × while a value is set (Backspace/Delete on the trigger too) — clears to undefined. */
  showClear?: boolean;
  /**
   * Type the date as well as pick it: the field becomes a text input (committed on blur/Enter) and
   * a calendar button opens the picker. Unreadable text reverts to the last value; empty text clears.
   */
  editable?: boolean;
  /** date-fns pattern typed and shown when `editable`. Default 'dd/MM/yyyy'; `/`, `-` or `.` all accepted. */
  dateFormat?: string;
}

/** Gap between the field and its calendar. */
const CALENDAR_OFFSET = 6;

function DatePicker({
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
  minDate,
  maxDate,
  captionLayout,
  showClear = false,
  editable = false,
  dateFormat = DEFAULT_DATE_FORMAT,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const z = usePopupZIndex();
  const topInset = usePopupTopInset();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const clearVisible = showClear && !!value && !readOnly && !disabled;
  const clear = () => onChange?.(undefined);
  const disabledDays = boundsMatchers(minDate, maxDate);

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
          slot="date-picker-trigger"
          label={value ? format(value, 'PPP') : null}
          placeholder={placeholder ?? 'Pick a date'}
          committedText={value ? formatDateText(value, dateFormat) : ''}
          editPlaceholder={formatHint(dateFormat)}
          editLabel="Type date"
          onCommitText={(text) => {
            const parsed = parseDateText(text, dateFormat);
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
            data-slot="date-picker-trigger"
            className={cn(pickerFieldClass({ invalid, readOnly, empty: !value }), className)}
          >
            <LuCalendar className="text-muted-foreground size-4 shrink-0" />
            <span className="min-w-0 truncate">{value ? format(value, 'PPP') : (placeholder ?? 'Pick a date')}</span>
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
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange?.(date);
                setOpen(false);
              }}
              defaultMonth={value}
              disabled={disabledDays}
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

export { DatePicker };
