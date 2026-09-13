import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';
import { InfoIcon } from 'lucide-react';

type IconType = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

/* --- Alert Container --- */
const alertVariants = cva(
  /* 'relative flex max-w-6xl items-start gap-2 rounded-md p-2 text-[0.8125rem] leading-[1.25rem] font-medium ring-1 ring-inset transition-colors', */
  'relative flex max-w-6xl items-start gap-1.5 rounded-md px-2 py-1.5 text-xs leading-[1.25rem] font-normal ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-info/4 text-info ring-info/12 dark:bg-info/12 dark:ring-info/24',
        secondary:
          'text-muted-foreground bg-[var(--color-gray-700)]/4 ring-[var(--color-gray-700)]/12 dark:bg-[var(--color-gray-700)]/12 dark:ring-[var(--color-gray-700)]/24',
        destructive:
          'bg-negative/4 text-negative ring-negative/12 dark:bg-negative/12 dark:ring-negative/24',
        success:
          'text-positive bg-[var(--color-green-700)]/4 ring-[var(--color-green-700)]/12 dark:bg-[var(--color-green-700)]/12 dark:ring-[var(--color-green-700)]/24',
        warning:
          'text-warning bg-[var(--color-orange-700)]/4 ring-[var(--color-orange-700)]/12 dark:bg-[var(--color-orange-700)]/12 dark:ring-[var(--color-orange-700)]/24',
        amber:
          'text-[var(--color-amber-700)] dark:text-[var(--color-amber-400)] bg-[var(--color-amber-700)]/4 ring-[var(--color-amber-700)]/12 dark:bg-[var(--color-amber-700)]/12 dark:ring-[var(--color-amber-700)]/24',
        primary:
          'text-primary bg-primary/4 ring-primary/12 dark:bg-primary/12 dark:ring-primary/24',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/* --- Icon Container (The Clerk Implementation) --- */
const alertIconVariants = cva(
  /* The 'after' pseudo-element with zero-width space makes this <span>
    the exact height of one line of text.
    The *:absolute logic then centers the icon within that line height.
  */
  'relative flex-none w-4 mt-2.5 after:invisible after:content-["\\200b"] *:absolute *:top-1/2 *:left-1/2 *:-translate-y-1/2 *:-translate-x-1/2',
  {
    variants: {
      variant: {
        default:     'text-info',
        secondary:   'text-muted-foreground',
        destructive: 'text-negative',
        success:     'text-positive',
        warning:     'text-warning',
        amber:       'text-[var(--color-amber-700)] dark:text-[var(--color-amber-400)]',
        primary:     'text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SimpleAlertProps
  extends React.ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

export function SimpleAlert({
  className,
  variant,
  icon: Icon = InfoIcon,
  children,
  ...props
}: SimpleAlertProps & { icon?: IconType | false }) {
  return (
    <div
      data-slot="simple-alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {Icon !== false && (
        <span className={cn(alertIconVariants({ variant }))}>
          <Icon className="size-3" strokeWidth={2.5} />
        </span>
      )}
      {children}
    </div>
  );
}

export interface AlertIconProps
  extends
    React.ComponentProps<'span'>,
    VariantProps<typeof alertIconVariants> {}

export function AlertIcon({
  className,
  variant,
  children,
  ...props
}: AlertIconProps) {
  return (
    <span className={cn(alertIconVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
