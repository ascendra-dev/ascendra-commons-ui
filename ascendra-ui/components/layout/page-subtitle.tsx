import { cn } from '@/ascendra-ui/shadcn';

export function PageSubtitle({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-subtitle" className={cn('text-muted-foreground text-xs', className)} {...props}>
      {children}
    </div>
  );
}
