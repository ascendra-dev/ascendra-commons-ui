import { cn } from '@/ascendra-ui/shadcn';

export function DataTableBarContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-bar-content"
      className={cn('order-1 flex w-full min-w-0 items-center gap-2 sm:order-0 sm:w-auto sm:flex-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}
