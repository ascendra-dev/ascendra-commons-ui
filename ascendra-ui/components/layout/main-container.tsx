import { cn } from '@/ascendra-ui/shadcn';

export function MainContainer({
  className,
  children,
  ...props
}: React.ComponentProps<'main'>) {
  return (
    <main data-slot="main-container"
      className={cn(
        'app-container mt-8 pb-12 lg:mt-10 lg:pb-16',
        // Layout modes (see layout-mode.ts): both drop the container's max width.
        'in-data-[layout=full-width]:max-w-none in-data-[layout=menu]:max-w-none',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-8 lg:not-in-data-[layout=menu]:flex-row">{children}</div>
    </main>
  );
}
