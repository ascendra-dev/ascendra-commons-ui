import { cn } from '@/ascendra-ui/shadcn';

export function DataTableBarContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-bar-content"
      className={cn('order-1 flex items-center gap-2 sm:order-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}
