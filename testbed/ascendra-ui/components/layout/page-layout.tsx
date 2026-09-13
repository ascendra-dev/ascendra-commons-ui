import { cn } from '@/ascendra-ui/shadcn';

export function PageLayout({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-layout"
      id="app-layout"
      data-sidebar="closed"
      className={cn(
        'group relative grid min-h-screen flex-1 grid-cols-1 grid-rows-[auto_auto_1fr]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
