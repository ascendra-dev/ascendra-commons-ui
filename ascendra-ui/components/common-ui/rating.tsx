"use client";

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

const colorFillMap = {
  default: 'var(--chart-1)',
  amber:   '#f59e0b',
  orange:  '#f97316',
  red:     '#ef4444',
  green:   '#22c55e',
  blue:    '#3b82f6',
  violet:  '#7c3aed',
} as const;

const starSizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

const gapMap = {
  xs: 'gap-px',
  sm: 'gap-0.5',
  md: 'gap-0.5',
  lg: 'gap-1',
  xl: 'gap-1',
} as const;

const labelSizeMap = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-base',
} as const;

// Stacked layout: big number above stars
const stackedNumSizeMap = {
  xs: 'text-2xl',
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
} as const;

const stackedDenomSizeMap = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
} as const;

export type RatingColor = keyof typeof colorFillMap;
export type RatingSize = keyof typeof starSizeMap;
export type RatingLayout = 'inline' | 'stacked';

export interface RatingProps
  extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  /** Current rating value (0–max). */
  rating: number;
  /** Total number of stars. */
  max?: number;
  /** Star size. */
  size?: RatingSize;
  /** Fill color of active stars. */
  color?: RatingColor;
  /** Whether to render half-star fills for fractional ratings. */
  precision?: 'full' | 'half';
  /** Show numeric value label. inline: beside stars; stacked: large number above stars. */
  showValue?: boolean;
  /** Visual layout. 'inline' (default) places value + stars in a row; 'stacked' places a large value above the stars. */
  layout?: RatingLayout;
  /** When provided, enables click-to-rate interaction. */
  onChange?: (value: number) => void;
  /** Disables interaction even when onChange is present. */
  readOnly?: boolean;
}

export function Rating({
  rating,
  max = 5,
  size = 'md',
  color = 'default',
  precision = 'half',
  showValue = false,
  layout = 'inline',
  onChange,
  readOnly = false,
  className,
  ...props
}: RatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const rawId = React.useId();
  const uid = rawId.replace(/:/g, '');

  const isInteractive = !readOnly && !!onChange;
  const displayRating = hovered ?? rating;
  const fillColor = colorFillMap[color];

  const stars = Array.from({ length: max }, (_, i) => {
    const starNum = i + 1;
    const filled = displayRating >= starNum;
    const half =
      precision === 'half' && !filled && displayRating >= starNum - 0.5;
    const gradId = `${uid}-half-${starNum}`;

    return (
      <svg
        key={starNum}
        viewBox="0 0 20 20"
        className={cn(
          starSizeMap[size],
          isInteractive && 'cursor-pointer transition-transform active:scale-95',
        )}
        role={isInteractive ? 'radio' : undefined}
        aria-checked={isInteractive ? displayRating >= starNum : undefined}
        aria-label={isInteractive ? `${starNum} star${starNum !== 1 ? 's' : ''}` : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onMouseEnter={() => isInteractive && setHovered(starNum)}
        onClick={() => isInteractive && onChange(starNum)}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(starNum);
                }
              }
            : undefined
        }
      >
        {half && (
          <defs>
            <linearGradient id={gradId}>
              <stop offset="50%" stopColor={fillColor} />
              <stop offset="50%" stopColor="currentColor" stopOpacity={0.15} />
            </linearGradient>
          </defs>
        )}
        <path
          fill={half ? `url(#${gradId})` : filled ? fillColor : 'currentColor'}
          fillOpacity={filled || half ? 1 : 0.15}
          d={STAR_PATH}
        />
      </svg>
    );
  });

  if (layout === 'stacked') {
    return (
      <div
        data-slot="rating"
        data-size={size}
        data-color={color}
        data-layout="stacked"
        role={isInteractive ? 'radiogroup' : 'img'}
        aria-label={`Rating: ${rating} out of ${max}`}
        className={cn('flex flex-col items-center gap-2', className)}
        onMouseLeave={() => isInteractive && setHovered(null)}
        {...props}
      >
        {showValue && (
          <p className={cn(stackedNumSizeMap[size], 'font-black tracking-tight text-foreground')}>
            {rating.toFixed(1)}
            <span className={cn(stackedDenomSizeMap[size], 'font-medium text-muted-foreground')}>
              /{max}
            </span>
          </p>
        )}
        <div className={cn('flex items-center', gapMap[size])}>
          {stars}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="rating"
      data-size={size}
      data-color={color}
      data-interactive={isInteractive || undefined}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${rating} out of ${max}`}
      className={cn('flex items-center', gapMap[size], className)}
      onMouseLeave={() => isInteractive && setHovered(null)}
      {...props}
    >
      {stars}

      {showValue && (
        <span className={cn('ml-1 tabular-nums text-muted-foreground', labelSizeMap[size])}>
          {rating.toFixed(1)}
          <span className="opacity-50">/{max}</span>
        </span>
      )}
    </div>
  );
}
