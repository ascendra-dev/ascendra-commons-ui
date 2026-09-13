import { cn } from '@/ascendra-ui/shadcn';

export function MainContainer({
  className,
  children,
  ...props
}: React.ComponentProps<'main'>) {
  return (
    <main data-slot="main-container"
      className={cn('app-container mt-8 pb-12 lg:mt-10 lg:pb-16', className)}
      {...props}
    >
      <div className="flex flex-col gap-8 lg:flex-row">{children}</div>
    </main>
  );
}
