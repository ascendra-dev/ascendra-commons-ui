import { cn } from '@/ascendra-ui/shadcn';

export function Header({
  className,
  children,
  ...props
}: React.ComponentProps<'header'>) {
  return (
    <header data-slot="header"
      className={cn(
        'border-border bg-muted text-foreground flex h-14 items-center justify-between border-b pr-[calc(var(--app-layout-spacing)/2)] pl-[calc(var(--app-layout-spacing)/2-12px)]',
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}
