import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/ascendra-ui/shadcn';

const badgeVariants = cva(
  /* Base styles: text-ceramic-label-4 properties */
  'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] px-1 py-0.5 font-medium transition-all text-2xs tracking-[0.015em] ring-1 ring-inset overflow-hidden',
  {
    variants: {
      size: {
        default: '',
        tiny: 'text-[9px] leading-[11px] px-0.5 py-px',
      },
      variant: {
        /* Primary/Purple */
        default:
          'text-primary bg-gradient-to-t from-black/[.02] bg-primary/4 ring-primary/16 dark:bg-primary/24',

        /* Gray */
        secondary:
          'text-muted-foreground bg-gradient-to-t from-black/[.02] bg-[var(--color-gray-700)]/4 ring-[var(--color-gray-700)]/16 dark:bg-[var(--color-gray-700)]/24',

        /* Orange */
        orange:
          'text-warning bg-gradient-to-t from-black/[.02] bg-[var(--color-orange-700)]/4 ring-[var(--color-orange-700)]/16 dark:bg-[var(--color-orange-700)]/24',

        /* Green */
        green:
          'text-positive bg-gradient-to-t from-black/[.02] bg-[var(--color-green-700)]/4 ring-[var(--color-green-700)]/16 dark:bg-[var(--color-green-700)]/16',

        /* Blue */
        blue:
          'text-info bg-gradient-to-t from-black/[.02] bg-info/4 ring-info/16 dark:bg-info/24',

        /* Red / Destructive */
        red:
          'text-negative dark:text-[var(--color-red-450)] bg-gradient-to-t from-black/[.02] bg-[var(--color-red-700)]/4 ring-[var(--color-red-700)]/16 dark:bg-[var(--color-red-700)]/24',

        /* Amber / Caution */
        amber:
          'text-[var(--color-amber-700)] dark:text-[var(--color-amber-400)] bg-gradient-to-t from-black/[.02] bg-[var(--color-amber-700)]/4 ring-[var(--color-amber-700)]/16 dark:bg-[var(--color-amber-700)]/24',

        /* Violet */
        violet:
          'text-violet-700 dark:text-violet-400 bg-gradient-to-t from-black/[.02] bg-violet-700/4 ring-violet-700/16 dark:bg-violet-700/24',

        /* Warning (semantic alias — orange token) */
        warning:
          'text-warning bg-gradient-to-t from-black/[.02] bg-warning/4 ring-warning/16 dark:bg-warning/24',

        /* Positive (semantic alias — green token) */
        positive:
          'text-positive bg-gradient-to-t from-black/[.02] bg-positive/4 ring-positive/16 dark:bg-positive/24',

        /* Info (semantic alias — blue token) */
        info:
          'text-info bg-gradient-to-t from-black/[.02] bg-info/4 ring-info/16 dark:bg-info/24',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function SimpleBadge({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="simple-badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {/* Using px-0.5 inside the wrapper to mimic the Clerk gap and alignment for badges with icons or text.
       */}
      <span className="flex items-center gap-1 px-0.5">{children}</span>
    </Comp>
  );
}
