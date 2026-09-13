'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { cn } from '@/ascendra-ui/shadcn';

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        /* Layout */
        'relative top-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-[.25rem] transition',
        'text-white',

        /* Light unchecked */
        'bg-white',
        'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_0_0_1px_rgba(25,28,33,.2),0_4px_4px_-2px_rgba(0,0,0,0.06)]',

        /* Dark unchecked */
        'dark:bg-gray-900',
        'dark:shadow-[0_-1px_1px_rgba(255,255,255,0.12),0_0_0_1px_#525260,0_0_0_2px_rgba(0,0,0,0.16)]',

        /* ::before — bottom-darken gradient */
        'before:pointer-events-none before:absolute before:inset-0 before:size-full before:rounded-[inherit]',
        'before:bg-linear-to-b before:to-black/2',
        'before:transition-opacity',

        /* ::after — top-lighten gloss (20% light, 6% dark — reduced to avoid shimmer on 14px) */
        'after:pointer-events-none after:absolute after:inset-0 after:size-full after:rounded-[inherit]',
        'after:bg-linear-to-b after:from-white/20 dark:after:from-white/6',
        'after:transition-opacity',

        /* Unchecked hover — bg shifts, ring tightens, gradients fade */
        'hover:bg-gray-100',
        'hover:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_0_0_1px_rgba(25,28,33,.28),0_4px_4px_-2px_rgba(0,0,0,0.07)]',
        'hover:before:opacity-0',
        'hover:after:opacity-0',

        /* Dark unchecked hover */
        'dark:hover:bg-(--color-gray-1100)',
        'dark:hover:shadow-[0_-1px_1px_rgba(255,255,255,0.2),0_0_0_1px_rgba(61,61,74,0.88),0_0_0_2px_rgba(0,0,0,0.2)]',

        /* Checked — ! overrides hover bg/shadow */
        'data-[state=checked]:bg-primary!',
        'data-[state=checked]:before:hidden',
        'data-[state=checked]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_#6c47ff]!',

        /* Dark checked */
        'dark:data-[state=checked]:bg-primary!',
        'dark:data-[state=checked]:shadow-[inset_0_1px_1px_rgba(255,255,255,0),0_-1px_0_rgba(255,255,255,0.32),0_0_0_1px_#775cff,0_0_0_2px_rgba(0,0,0,0.16)]!',

        /* Checked hover — ring darkens */
        'data-[state=checked]:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_#6038ff]!',

        /* Dark checked hover — upward highlight dims .32 → .20 */
        'dark:data-[state=checked]:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0),0_-1px_0_rgba(255,255,255,0.2),0_0_0_1px_#775cff,0_0_0_2px_rgba(0,0,0,0.16)]!',

        /* Indeterminate — same visual treatment as checked */
        'data-[state=indeterminate]:bg-primary!',
        'data-[state=indeterminate]:before:hidden',
        'data-[state=indeterminate]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_#6c47ff]!',

        /* Dark indeterminate */
        'dark:data-[state=indeterminate]:bg-primary!',
        'dark:data-[state=indeterminate]:shadow-[inset_0_1px_1px_rgba(255,255,255,0),0_-1px_0_rgba(255,255,255,0.32),0_0_0_1px_#775cff,0_0_0_2px_rgba(0,0,0,0.16)]!',

        /* Indeterminate hover */
        'data-[state=indeterminate]:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_#6038ff]!',

        /* Dark indeterminate hover */
        'dark:data-[state=indeterminate]:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0),0_-1px_0_rgba(255,255,255,0.2),0_0_0_1px_#775cff,0_0_0_2px_rgba(0,0,0,0.16)]!',

        /* Invalid */
        'aria-invalid:bg-red-100!',
        'aria-invalid:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_0_0_1px_#e02e2e,0_4px_4px_-2px_rgba(0,0,0,0.06)]!',
        'dark:aria-invalid:bg-(--color-red-1100)!',
        'dark:aria-invalid:shadow-[0_-1px_1px_rgba(255,255,255,0.12),0_0_0_1px_#f73d3d,0_0_0_2px_rgba(0,0,0,0.16)]!',
        'aria-invalid:hover:bg-red-200!',
        'dark:aria-invalid:hover:bg-(--color-red-1000)!',

        /* Disabled */
        'disabled:cursor-not-allowed disabled:opacity-40',

        /* Focus */
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-3',

        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="group/indicator relative z-10 flex items-center justify-center">
        <svg
          className="checkbox-svg size-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* checkmark — hidden when indeterminate */}
          <path
            className="group-data-[state=indeterminate]/indicator:hidden"
            d="M4.25 8.75L7.25 11.75L11.75 4.25"
          />
          {/* dash — hidden when checked */}
          <path
            className="group-data-[state=checked]/indicator:hidden"
            d="M4.5 8H11.5"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
