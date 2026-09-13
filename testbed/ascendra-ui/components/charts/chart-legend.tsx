import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';

const chartLegendVariants = cva(
  'flex items-center text-xs text-muted-foreground',
  {
    variants: {
      size: {
        xs: 'gap-1',
        sm: 'gap-1.5',
        md: 'gap-2',
        lg: 'gap-2.5',
      },
    },
    defaultVariants: { size: 'sm' },
  }
);

const swatchVariants = cva('shrink-0', {
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
    shape: {
      round: 'rounded-full',
      square: 'rounded-[2px]',
    },
    size: {
      xs: 'h-1 w-1',
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4',
    },
  },
  defaultVariants: { variant: 'chart-1', shape: 'round', size: 'sm' },
});

export function ChartLegend({
  className,
  variant,
  shape,
  size,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof swatchVariants> &
  VariantProps<typeof chartLegendVariants>) {
  return (
    <div
      data-slot="chart-legend"
      className={cn(chartLegendVariants({ size }), className)}
      {...props}
    >
      <span
        data-slot="chart-legend-swatch"
        className={swatchVariants({ variant, shape, size })}
      />
      {children}
    </div>
  );
}

const chartLegendGroupVariants = cva('flex flex-wrap gap-x-4 gap-y-1.5', {
  variants: {
    align: {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    },
  },
  defaultVariants: { align: 'center' },
});

export function ChartLegendGroup({
  className,
  align,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof chartLegendGroupVariants>) {
  return (
    <div
      data-slot="chart-legend-group"
      className={cn(chartLegendGroupVariants({ align }), className)}
      {...props}
    />
  );
}
