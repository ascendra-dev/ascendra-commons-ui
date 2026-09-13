import Link from 'next/link';
import { cn } from '@/ascendra-ui/shadcn';

export function HeaderLink({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <div data-slot="header-link" className="px-1">
      <Link
        className={cn(
          'bg-transparent focus-visible:outline-primary flex h-6 items-center gap-2 rounded-sm px-2 focus-visible:outline-2',
          className
        )}
        {...props}
      >
        {children}
      </Link>
    </div>
  );
}
