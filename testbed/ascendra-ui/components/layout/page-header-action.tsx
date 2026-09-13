import { cn } from '@/ascendra-ui/shadcn';

/* use class "w-fit" if do not require expanding */
export function PageHeaderAction({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-action"
      className={cn('w-full sm:w-fit', className)}
      {...props}
    >
      {children}
    </div>
  );
}
