import { cn } from '@/ascendra-ui/shadcn';

/**
 * The pill that shows one applied filter — a page-level column filter (DataTableFilterItem) or one criterion of
 * a query run (the query menu). Internal: one shell so the two can't drift apart.
 *
 * Layout: `[icon label | value]`. With `action`, the icon and label are one button (remove / mute); without it, the
 * label is plain text. The value goes in a FilterChipValue child, which draws the divider — leave it out for a
 * label-only chip.
 *
 * Border, divider and fill all derive from `--foreground`, so the chip reads the same on any surface in either theme: a
 * fixed gray border on `bg-muted` sank into a darker hole in dark mode, its divider a different color again.
 */
export function FilterChip({
  label,
  action,
  className,
  children,
}: {
  label: React.ReactNode;
  /** Button props for the icon + label, plus its icon. Omit for a chip that can't be removed. */
  action?: React.ComponentProps<'button'> & { icon: React.ReactNode };
  className?: string;
  children?: React.ReactNode;
}) {
  const { icon, className: actionClassName, ...actionProps } = action ?? { icon: null };
  // Spans throughout, so a chip is valid inside a button (the query bar's "N criteria").
  return (
    <span
      data-slot="filter-chip"
      className={cn(
        'bg-foreground/5 border-foreground/14 flex max-w-full items-center rounded-full border py-0.75 text-xs',
        className,
      )}
    >
      {action ? (
        <button
          type="button"
          className={cn('flex shrink-0 cursor-pointer items-center gap-1 px-1.5', actionClassName)}
          {...actionProps}
        >
          {icon}
          {label}
        </button>
      ) : (
        <span className="shrink-0 px-1.5">{label}</span>
      )}
      {children}
    </span>
  );
}

/** The value side of a FilterChip, after the divider. Takes a ref and props, so it can be a dropdown trigger. */
export function FilterChipValue({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="filter-chip-value"
      className={cn('border-foreground/14 flex min-w-0 items-center gap-1 border-l px-1.5', className)}
      {...props}
    />
  );
}
