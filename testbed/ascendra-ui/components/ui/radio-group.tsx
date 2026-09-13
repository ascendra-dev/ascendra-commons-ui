'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from '@/ascendra-ui/shadcn';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  wrapperClassName?: string;
}) {
  return (
    <div className={cn('group/radio flex items-center', wrapperClassName)}>
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        className={cn(
          /* Layout */
          'relative top-0.5 inline-block size-3.5 shrink-0 rounded-full transition',

          /* Light base */
          'bg-white',
          'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.06)]',
          'ring-1 ring-(--color-umbra)/20',

          /* Dark base */
          'dark:bg-gray-900',
          'dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.12),0_4px_4px_-2px_rgba(0,0,0,0.36)]',
          'dark:ring-gray-800/92',

          /* ::before — bottom-darken gradient (visible unchecked, hidden checked) */
          'before:absolute before:inset-0 before:size-full before:rounded-[inherit]',
          'before:bg-linear-to-b before:to-black/2',
          'before:transition-opacity',

          /* ::after — top-lighten gloss (hidden unchecked, block checked) */
          'after:absolute after:inset-0 after:hidden after:size-full after:rounded-[inherit]',
          'after:bg-linear-to-b after:from-white/20',
          'after:transition-opacity',

          /* Light hover */
          'group-hover/radio:before:opacity-0',
          'group-hover/radio:bg-gray-100',
          'group-hover/radio:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.07)]',
          'group-hover/radio:ring-(--color-umbra)/[.28]',

          /* Dark hover — goes darker (gray-1100) */
          'dark:group-hover/radio:bg-(--color-gray-1100)',
          'dark:group-hover/radio:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]',
          'dark:group-hover/radio:ring-(--color-gray-1000)/88',

          /* Checked */
          'data-[state=checked]:before:hidden data-[state=checked]:after:block',
          'data-[state=checked]:bg-primary',
          'data-[state=checked]:shadow-[0_4px_4px_-3px_rgba(0,0,0,0.32)]',
          'data-[state=checked]:ring-(--color-purple-650)',

          /* Dark checked */
          'dark:data-[state=checked]:bg-primary',
          'dark:data-[state=checked]:shadow-[0_4px_4px_-3px_rgba(0,0,0,0.16)]',
          'dark:data-[state=checked]:ring-purple-600',

          /* Checked + hover — gloss fades */
          'group-hover/radio:data-[state=checked]:after:opacity-0',

          /* Focus ring */
          'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-3',

          /* Disabled */
          'data-disabled:cursor-not-allowed data-disabled:opacity-40',

          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="relative z-10 flex h-full w-full items-center justify-center">
          <div
            className="absolute size-1.25 rounded-full bg-white"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-50%)',
            }}
            aria-hidden="true"
          />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    </div>
  );
}

export { RadioGroup, RadioGroupItem };
