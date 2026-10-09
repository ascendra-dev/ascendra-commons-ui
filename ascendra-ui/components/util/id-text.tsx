'use client';

import { cn } from '@/ascendra-ui/shadcn';
import { WithCopyText } from './with-copy-text';
import { WithTooltip } from './with-tooltip';

export type IdTextSize = 'full' | 'sm' | 'md' | 'lg';

interface SizeConfig {
  /** Characters kept from the start. Omitted (with tail) for 'full' — no truncation. */
  head?: number;
  /** Characters kept from the end. */
  tail?: number;
  className: string;
}

const SIZES: Record<IdTextSize, SizeConfig> = {
  full: { className: '' },
  sm: { head: 4, tail: 4, className: 'text-xs' },
  md: { head: 6, tail: 4, className: 'text-xs' },
  lg: { head: 8, tail: 6, className: 'text-sm' },
};

export interface IdTextProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The full, untruncated id/uuid value — copied and shown in the tooltip in full, regardless of size. */
  value: string;
  /** How many characters show before truncating to "head…tail" — 'full' shows the value as-is. Default 'full'. */
  size?: IdTextSize;
  /** Copy-to-clipboard on click, with icon feedback. Default true. */
  copyable?: boolean;
  /** Hover tooltip showing the full value. Default true. */
  showTooltip?: boolean;
}

/**
 * Fixed-monospace display for a uuid/id-shaped value. Shows the value as-is
 * by default ('full'); 'sm'/'md'/'lg' truncate to "head…tail" (matches
 * audit-logging.api/mocks.html's own id treatment) for tighter spaces like a
 * table cell. Composes WithCopyText (click-to-copy, icon feedback) and
 * WithTooltip (full value on hover) rather than reimplementing either —
 * both on by default, both independently overridable. `className`/`style`
 * reach the text itself, so a consumer can override font-size without
 * touching the monospace font.
 */
export function IdText({
  value,
  size = 'full',
  copyable = true,
  showTooltip = true,
  className,
  style,
  ...props
}: IdTextProps) {
  const { head, tail, className: sizeClassName } = SIZES[size];
  const display =
    head != null && tail != null && value.length > head + tail + 1
      ? `${value.slice(0, head)}…${value.slice(-tail)}`
      : value;

  const text = (
    <span className={cn('font-mono', sizeClassName, className)} style={style} {...props}>
      {display}
    </span>
  );

  const withCopy = copyable ? (
    <WithCopyText value={value} showTooltip={false}>
      {text}
    </WithCopyText>
  ) : (
    text
  );

  return showTooltip ? <WithTooltip tooltip={value}>{withCopy}</WithTooltip> : withCopy;
}
