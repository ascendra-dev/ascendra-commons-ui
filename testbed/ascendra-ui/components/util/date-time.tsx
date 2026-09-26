'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/ascendra-ui/shadcn';
import { formatDateTime, type FormatDateTimeOptions } from '@/ascendra-ui/utils/common.util';

export interface DateTimeProps extends FormatDateTimeOptions {
  value: string | Date;
  /** Show a hover tooltip with the original timestamp as a full ISO string. Default false. */
  showTooltip?: boolean;
}

/**
 * Renders `formatDateTime(value, options)` as text — the display counterpart to that
 * function, taking the exact same `style`/`time`/`relativeFallbackDays` options as props.
 * `showTooltip` reveals the original timestamp as a full ISO string on hover, useful
 * whenever the display format (especially `style: 'relative'`) hides precision a user
 * may still want on demand.
 */
export function DateTime({
  value,
  showTooltip = false,
  style,
  time,
  relativeFallbackDays,
  className,
  ...props
}: DateTimeProps & Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const formatted = formatDateTime(date, { style, time, relativeFallbackDays });

  const content = (
    <span className={className} {...props}>
      {formatted}
    </span>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{date.toISOString()}</TooltipContent>
    </Tooltip>
  );
}
