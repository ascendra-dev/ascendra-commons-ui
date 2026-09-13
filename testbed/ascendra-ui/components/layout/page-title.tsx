import { cn } from '@/ascendra-ui/shadcn';

export function PageTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-title" className={cn('truncate text-2xl font-medium', className)} {...props}>
      {children}
    </div>
  );
}
