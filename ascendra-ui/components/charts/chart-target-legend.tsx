import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';

const chartTargetLegendVariants = cva(
  'flex items-center text-xs text-muted-foreground',
  {
    variants: {
      size: {
        md: 'gap-2',
        lg: 'gap-2.5',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const targetSwatchVariants = cva('shrink-0 h-0.5 rounded-full', {
  variants: {
    variant: {
      'chart-1': 'bg-chart-1',
      'chart-2': 'bg-chart-2',
      'chart-3': 'bg-chart-3',
      'chart-4': 'bg-chart-4',
      'chart-5': 'bg-chart-5',
      'chart-6': 'bg-chart-6',
      'chart-7': 'bg-chart-7',
      'chart-8': 'bg-chart-8',
    },
    size: {
      md: 'w-4',
      lg: 'w-6',
    },
  },
  defaultVariants: { variant: 'chart-1', size: 'md' },
});

export function ChartTargetLegend({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof targetSwatchVariants> &
  VariantProps<typeof chartTargetLegendVariants>) {
  return (
    <div
      data-slot="chart-target-legend"
      className={cn(chartTargetLegendVariants({ size }), className)}
      {...props}
    >
      <span
        data-slot="chart-target-legend-swatch"
        className={targetSwatchVariants({ variant, size })}
      />
      {children}
    </div>
  );
}

const chartTargetLegendGroupVariants = cva('flex flex-wrap gap-x-4 gap-y-1.5', {
  variants: {
    align: {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    },
  },
  defaultVariants: { align: 'center' },
});

export function ChartTargetLegendGroup({
  className,
  align,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof chartTargetLegendGroupVariants>) {
  return (
    <div
      data-slot="chart-target-legend-group"
      className={cn(chartTargetLegendGroupVariants({ align }), className)}
      {...props}
    />
  );
}
