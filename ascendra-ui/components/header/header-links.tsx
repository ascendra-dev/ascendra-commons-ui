import { cn } from '@/ascendra-ui/shadcn';

export function HeaderLinks({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="header-links"
      className={cn(
        'no-scrollbar flex flex-1 items-center overflow-x-auto',
        className
      )}
      {...props}
    >
      <div className="me-4 flex h-10 items-center gap-0.5 whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
