import { LuPanelRightOpen } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';

/**
 * Display only: shows a panel icon after children while they're hovered (or their
 * clickable parent is keyboard-focused), signalling "this opens a sheet". The click
 * itself belongs to the caller's button.
 */
export function WithSheetIcon({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn('group/sheet-icon inline-flex items-center gap-1', className)}
      {...props}
    >
      {children}
      {/* Space is always reserved, so revealing the icon never shifts the text. */}
      <LuPanelRightOpen
        aria-hidden
        className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover/sheet-icon:opacity-100 in-focus-visible:opacity-100"
      />
    </span>
  );
}
