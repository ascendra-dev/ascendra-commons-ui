'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/ascendra-ui/shadcn';
import { buttonVariants } from '@/ascendra-ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ascendra-ui/components/ui/select';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

type CalendarDropdownProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> & {
  options?: { value: number; label: string; disabled: boolean }[];
  components?: unknown;
  classNames?: unknown;
};

function CalendarDropdown({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  disabled,
  // consumed by react-day-picker but not used in custom render
  components: _components,
  classNames: _classNames,
}: CalendarDropdownProps) {
  return (
    <Select
      value={value?.toString()}
      onValueChange={(str) => {
        onChange?.({
          target: { value: str },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="h-7 min-w-0" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-60 max-h-72">
        {options?.map(({ value: val, label, disabled: optDisabled }) => (
          <SelectItem key={val} value={val.toString()} disabled={optDisabled}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout,
  startMonth,
  endMonth,
  ...props
}: CalendarProps) {
  const resolvedCaptionLayout =
    captionLayout ?? (startMonth || endMonth ? 'dropdown' : 'label');

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={resolvedCaptionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        dropdowns: 'flex items-center gap-1.5',
        nav: 'absolute top-3 left-0 right-0 h-7 flex items-center justify-between px-1',
        button_previous: cn(
          buttonVariants({ variant: 'secondary', size: 'icon' }),
          'h-7 w-7 bg-transparent hover:bg-muted opacity-50 hover:opacity-100 shadow-none'
        ),
        button_next: cn(
          buttonVariants({ variant: 'secondary', size: 'icon' }),
          'h-7 w-7 bg-transparent hover:bg-muted opacity-50 hover:opacity-100 shadow-none'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md [&:has([aria-selected].range-end)]:rounded-r-md [&:has([aria-selected].range-start)]:rounded-l-md',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal text-foreground aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md shadow-none focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-1'
        ),
        range_start:
          'range-start [&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary [&>button]:hover:text-white rounded-l-md',
        range_end:
          'range-end [&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary [&>button]:hover:text-white rounded-r-md',
        selected:
          '[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary [&>button]:hover:text-white',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <LuChevronLeft className="size-4" />
          ) : (
            <LuChevronRight className="size-4" />
          ),
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
