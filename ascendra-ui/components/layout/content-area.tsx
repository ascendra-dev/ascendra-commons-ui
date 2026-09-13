import { cn } from '@/ascendra-ui/shadcn';

export function ContentArea({
  className,
  children,
  ...props
}: React.ComponentProps<'section'>) {
  return (
    <section data-slot="content-area" className={cn('flex-1 min-w-0', className)} {...props}>
      {children}
    </section>
  );
}
