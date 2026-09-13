import { cn } from '@/ascendra-ui/shadcn';

export function DataTableBarAction({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-bar-action"
      className={cn('ml-auto flex items-center gap-2 sm:ml-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}
