import { cn } from '@/ascendra-ui/shadcn';

export function PageHeaderGroup({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-header-group" className={cn('flex flex-col gap-0.5', className)} {...props}>
      {children}
    </div>
  );
}
