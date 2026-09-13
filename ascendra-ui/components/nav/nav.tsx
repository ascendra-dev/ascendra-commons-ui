import { cn } from '@/ascendra-ui/shadcn';

export function Nav({
  className,
  children,
  ...props
}: React.ComponentProps<'nav'>) {
  return (
    <nav
      data-slot="nav"
      className={cn('bg-background sticky top-0 z-100', className)}
      {...props}
    >
      <div className="bg-muted text-foreground relative">
        <div className="bg-border pointer-events-none absolute inset-x-0 bottom-0 h-px" />
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex h-12 items-center gap-3 pr-[calc(var(--app-layout-spacing)/2)] pl-[calc(var(--app-layout-spacing)/2-12px)] whitespace-nowrap">
            <div className="pl-1">{children}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
