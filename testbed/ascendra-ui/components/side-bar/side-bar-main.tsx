import { cn } from '@/ascendra-ui/shadcn';

export function SideBarMain({
  className,
  children,
  ...props
}: React.ComponentProps<'main'>) {
  return (
    <main data-slot="side-bar-main" className={cn('my-4', className)} {...props}>
      {children}
    </main>
  );
}
