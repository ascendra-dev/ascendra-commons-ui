import { cn } from '@/ascendra-ui/shadcn';

export function TabList({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="tab-list" className={cn('relative', className)} {...props}>
      <div className="bg-border/60 pointer-events-none absolute inset-x-0 bottom-0 h-px" />
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex h-9 items-center gap-1 [&>div:first-child>a]:pl-0">
          {children}
        </div>
      </div>
    </div>
  );
}
