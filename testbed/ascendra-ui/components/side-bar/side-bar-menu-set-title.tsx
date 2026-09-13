import { cn } from '@/ascendra-ui/shadcn';

export function SideBarMenuSetTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="side-bar-menu-set-title" className={cn('text-muted-foreground mb-1 px-3.5', className)} {...props}>
      {children}
    </div>
  );
}
