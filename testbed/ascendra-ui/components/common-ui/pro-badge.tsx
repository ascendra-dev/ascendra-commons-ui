import { cn } from '@/ascendra-ui/shadcn';

export function ProBadge({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="pro-badge"
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-[.35rem] text-white',
        'overflow-hidden px-1 py-0.5 text-[10px]',
        'bg-[linear-gradient(120deg,rgb(73,90,193)_0%,rgb(64,63,115)_16%,rgb(99,131,162)_50%,rgb(81,36,82)_87%,rgb(132,61,112)_100%)] shadow-[inset_0_2px_0_rgba(43,117,225,0.35)] ring-1 ring-black/42 ring-inset dark:bg-[linear-gradient(120deg,rgb(39,46,123)_0%,rgb(48,47,91)_16%,rgb(73,95,119)_50%,rgb(66,35,57)_87%,rgb(92,46,79)_100%)] dark:shadow-none dark:ring-white/12',
        className
      )}
      {...props}
    >
      <span className="px-0.5">{children}</span>
    </span>
  );
}
