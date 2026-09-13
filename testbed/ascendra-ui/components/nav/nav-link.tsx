'use client';

import Link from 'next/link';
import { cn } from '@/ascendra-ui/shadcn';

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
};

export function NavLink({
  href,
  children,
  exact = false,
}: NavLinkProps) {
  const isActive = exact;

  return (
    <Link
      data-slot="nav-link"
      href={href}
      className={cn(
        'focus-visible:outline-primary hover:text-foreground inline-flex h-6 items-center rounded-[0.375rem] px-2 transition-colors focus-visible:outline-2',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'relative',
          isActive &&
            "after:absolute after:-bottom-3.5 after:left-0 after:h-px after:w-full after:bg-black after:content-[''] dark:after:bg-white"
        )}
      >
        {children}
      </span>
    </Link>
  );
}
