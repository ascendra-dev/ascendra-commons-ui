import { cn } from '@/ascendra-ui/shadcn';

export function SideBarMenuItemGroup({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="side-bar-menu-item-group" className={cn('flex flex-col gap-0.5 p-0.5', className)} {...props}>
      {children}
    </div>
  );
}
