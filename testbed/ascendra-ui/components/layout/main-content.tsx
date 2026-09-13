import { cn } from '@/ascendra-ui/shadcn';

export function MainContent({
  className,
  children,
  ...props
}: React.ComponentProps<'main'>) {
  return (
    <main data-slot="main-content"
      className={cn('flex w-full flex-col gap-6 lg:flex-1', className)}
      {...props}
    >
      {children}
    </main>
  );
}
