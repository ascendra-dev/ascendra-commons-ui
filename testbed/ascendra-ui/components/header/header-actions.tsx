import { cn } from '@/ascendra-ui/shadcn';

export function HeaderActions({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="header-actions" className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}
