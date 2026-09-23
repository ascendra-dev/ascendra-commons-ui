import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';
import { SimpleBadge } from '@/ascendra-ui/components/common-ui/simple-badge';
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu';

export function KpiTile({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="kpi-tile"
      className={cn('flex flex-1 flex-col p-5', className)}
      {...props}
    />
  );
}

export function KpiLabel({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="kpi-label"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

const kpiValueVariants = cva('font-bold tracking-tight text-foreground', {
  variants: {
    size: {
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    variant: {
      default: '',
      warning: 'text-amber-600 dark:text-amber-400',
    },
  },
  defaultVariants: { size: '2xl', variant: 'default' },
});

export function KpiValue({
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<'p'> & VariantProps<typeof kpiValueVariants>) {
  return (
    <p
      data-slot="kpi-value"
      className={cn(kpiValueVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export function KpiTrend({
  direction,
  variant = 'badge',
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & {
  direction: 'up' | 'down';
  variant?: 'badge' | 'text';
}) {
  const Icon = direction === 'up' ? LuTrendingUp : LuTrendingDown;

  if (variant === 'text') {
    return (
      <span
        data-slot="kpi-trend"
        data-variant="text"
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-semibold',
          direction === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400',
          className
        )}
        {...props}
      >
        <Icon className="size-3" />
        {children}
      </span>
    );
  }

  return (
    <SimpleBadge
      data-slot="kpi-trend"
      data-variant="badge"
      variant={direction === 'up' ? 'green' : 'red'}
      className={className}
      {...props}
    >
      <Icon className="size-3" />
      {children}
    </SimpleBadge>
  );
}

export function KpiCaption({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="kpi-caption"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}
