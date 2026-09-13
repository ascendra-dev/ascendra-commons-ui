import { cn } from '@/ascendra-ui/shadcn';

export function PageWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-wrapper" className={cn('', className)} {...props}>
      <div className="border-border border-b [[data-slot=page-wrapper]:has([data-slot=stepper])_&]:hidden" />
      {children}
    </div>
  );
}
