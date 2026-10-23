import { cn } from '@/ascendra-ui/shadcn';
import { PageBackButton } from '@/ascendra-ui/components/forms/back-link';

export function PageTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-title" className={cn('truncate text-2xl font-medium', className)} {...props}>
      {/* Opened from another section (useBackTo): a way back there, beside the title. */}
      <PageBackButton />
      {children}
    </div>
  );
}
