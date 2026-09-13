import { cn } from '@/ascendra-ui/shadcn';

export function PageContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-content"
      className={cn('mt-8 flex flex-col gap-6 [[data-slot=page-bar]+&]:mt-0', className)}
      {...props}
    >
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {children}
      </div>
    </div>
  );
}
