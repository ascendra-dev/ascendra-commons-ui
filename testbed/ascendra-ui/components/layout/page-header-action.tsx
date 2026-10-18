import { cn } from '@/ascendra-ui/shadcn';

/* use class "w-fit" if do not require expanding — it then sits on the right (ml-auto), also when a
   small screen wraps it onto its own line */
export function PageHeaderAction({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-action"
      className={cn('ml-auto w-full sm:w-fit', className)}
      {...props}
    >
      {children}
    </div>
  );
}
