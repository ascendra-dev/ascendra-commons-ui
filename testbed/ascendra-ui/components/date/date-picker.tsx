'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { format } from 'date-fns';
import { type CalendarProps } from '@/ascendra-ui/components/date/calendar';
import { LuCalendar } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';
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
  captionLayout?: CalendarProps['captionLayout'];
}

function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'Pick a date',
  disabled,
  readOnly,
  invalid,
  className,
  fromYear,
  toYear,
  captionLayout,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

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
          data-slot="date-picker-trigger"
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-[.375rem] px-3 text-left text-sm transition',
            'ring-1',
            'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]',
            'dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            invalid && 'outline-2 outline-destructive outline-offset-1',
            !value && 'text-gray-500 dark:text-gray-700',
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
          {value ? format(value, 'PPP') : placeholder}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 overflow-hidden rounded-xl',
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
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            defaultMonth={value}
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

export { DatePicker };
