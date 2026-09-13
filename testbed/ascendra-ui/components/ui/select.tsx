'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';

import { cn } from '@/ascendra-ui/shadcn';
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react';

const SelectContext = React.createContext<{ readOnly?: boolean }>({});

function Select({
  readOnly,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root> & { readOnly?: boolean }) {
  return (
    <SelectContext.Provider value={{ readOnly }}>
      <SelectPrimitive.Root
        data-slot="select"
        open={readOnly ? false : open}
        onOpenChange={readOnly ? () => {} : onOpenChange}
        {...props}
      />
    </SelectContext.Provider>
  );
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('scroll-my-1 p-1', className)}
      {...props}
    />
  );
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  readOnly: readOnlyProp,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
  readOnly?: boolean;
}) {
  const { readOnly: readOnlyCtx } = React.useContext(SelectContext);
  const readOnly = readOnlyProp ?? readOnlyCtx;

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'py-0.75',
        'group relative inline-flex items-center px-1',
        'min-w-fit overflow-hidden rounded-[0.25rem]',
        'text-foreground text-sm font-medium',
        'data-placeholder:text-muted-foreground data-placeholder:font-normal',
        'transition-all',
        'disabled:cursor-not-allowed disabled:opacity-40',
        /* Invalid */
        'aria-invalid:outline-destructive aria-invalid:outline-2 aria-invalid:outline-offset-1',
        size === 'sm' && 'h-5',
        size === 'default' && 'h-8',
        /* State-dependent: readonly vs normal */
        readOnly ? [
          'bg-gray-100 dark:bg-white/5',
          'shadow-[0_0_0_1px_#d1d5db] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]',
          'cursor-default',
          'focus-visible:outline-none',
        ] : [
          'bg-secondary',
          'shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]',
          'dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]',
          'before:pointer-events-none before:absolute before:inset-0',
          'before:bg-linear-to-b before:from-black/0 before:to-black/2 before:from-30%',
          'before:transition-opacity dark:before:to-black/12',
          'cursor-pointer',
          'hover:before:opacity-0',
          'hover:bg-gray-50',
          'dark:hover:bg-secondary',
          'focus-visible:outline-primary! focus-visible:outline-2! focus-visible:outline-offset-1!',
        ],
        className
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between">
        <span className="px-1.25">{children}</span>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </div>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'start',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const wasPointerDown = React.useRef(false);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === 'item-aligned'}
        position={position}
        align={align}
        onPointerDown={() => {
          wasPointerDown.current = true;
        }}
        onCloseAutoFocus={(e) => {
          if (wasPointerDown.current) {
            e.preventDefault();
            wasPointerDown.current = false;
          }
        }}
        className={cn(
          `z-1001 bg-secondary data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 isolate flex max-w-[calc(100vw-(--spacing(4))*2)] origin-(--radix-select-content-transform-origin) flex-col overflow-clip shadow-[0_16px_36px_-6px_rgba(0,0,0,.07),0_6px_16px_-2px_rgba(0,0,0,.2)] ring-1 duration-100 dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,.07),0_6px_16px_-2px_rgba(0,0,0,.2)] dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:z-50 dark:after:size-full dark:after:rounded-[inherit] dark:after:ring-1 dark:after:ring-white/4 dark:after:ring-inset [:where(&)]:relative [:where(&)]:min-w-[--trigger-width] [:where(&)]:rounded-md [:where(&)]:bg-white [:where(&)]:ring-[#191c21]/8 [:where(&)]:dark:ring-[#111113]/32`,
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport
          data-position={position}
          className="group/content rounded-inherit flex-1 scroll-py-2 overflow-auto overscroll-contain p-1 data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)"
        >
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('text-muted-foreground px-1.5 py-1 text-xs', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        /* Layout */
        'group relative grid cursor-default grid-cols-[1fr_1rem] items-center gap-2 rounded-[0.375rem] px-2 py-1 text-sm outline-none select-none',

        /* 1. HIGHLIGHT STATE (Hover/Keyboard) */
        'dark:data-highlighted:bg-border data-highlighted:text-foreground data-highlighted:bg-[#f6f6f7] data-highlighted:ring-1 data-highlighted:ring-[#EBEBED] data-highlighted:ring-inset dark:data-highlighted:ring-[#1f1f23]',

        /* 2. SELECTED STATE (Persistent Background) */
        'dark:data-[state=checked]:bg-border data-[state=checked]:text-foreground data-[state=checked]:bg-[#f6f6f7] data-[state=checked]:ring-1 data-[state=checked]:ring-[#EBEBED] data-[state=checked]:ring-inset dark:data-[state=checked]:ring-[#1f1f23]',

        /* 3. CLERK LOGIC: Hide selected background if moving over OTHER items */
        'group-hover/content:data-[state=checked]:not-data-highlighted:bg-transparent',
        'group-hover/content:data-[state=checked]:not-data-highlighted:ring-0',

        /* Disabled */
        'data-disabled:pointer-events-none data-disabled:opacity-40',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

      <span className="flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
