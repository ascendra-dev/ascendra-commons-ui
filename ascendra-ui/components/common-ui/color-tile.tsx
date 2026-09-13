import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';

const colorTileVariants = cva(
  'flex flex-col items-center justify-center gap-1 rounded-lg p-3 text-white',
  {
    variants: {
      variant: {
        primary:  'bg-primary',
        gray:     'bg-gray-500',
        green:    'bg-green-500',
        emerald:  'bg-emerald-600',
        blue:     'bg-blue-600',
        sky:      'bg-sky-500',
        orange:   'bg-orange-500',
        amber:    'bg-amber-600',
        yellow:   'bg-yellow-500',
        red:      'bg-red-600',
        rose:     'bg-rose-600',
        violet:   'bg-violet-600',
        pink:     'bg-pink-600',
        indigo:   'bg-indigo-600',
        teal:     'bg-teal-600',
        cyan:     'bg-cyan-600',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export function ColorTile({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof colorTileVariants>) {
  return (
    <div
      data-slot="color-tile"
      data-variant={variant}
      className={cn(colorTileVariants({ variant }), className)}
      {...props}
    />
  );
}

export function ColorTileTitle({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="color-tile-title"
      className={cn('text-xs font-bold opacity-80', className)}
      {...props}
    />
  );
}

export function ColorTileSubTitle({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="color-tile-subtitle"
      className={cn('text-center text-[0.6rem] font-semibold leading-tight', className)}
      {...props}
    />
  );
}
