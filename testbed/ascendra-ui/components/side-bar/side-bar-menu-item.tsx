'use client';

import React, { useLayoutEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/ascendra-ui/shadcn';
import { usePathname } from 'next/navigation';
import { useIsSmallScreen } from '@/ascendra-ui/hooks/use-is-small-screen';
import { pathMatches, useSideBar } from './side-bar';

type IconType = React.ComponentType<{ className?: string }>;

type Props = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  path: string;
  icon?: IconType;
  alternate?: 'default' | 'stand-alone';
  children: React.ReactNode;
};

export function SideBarMenuItem({
  path,
  alternate = 'default',
  className,
  children,
  icon: Icon,
  ...props
}: Props) {
  const isSmallScreen = useIsSmallScreen();
  const pathname = usePathname();
  const { paths, registerPath } = useSideBar();
  useLayoutEffect(() => registerPath?.(path), [registerPath, path]);
  // Active on its own page and every page inside it — unless a more specific item in the same sidebar matches too
  // (Overview at /access stays unlit on /access/people/ann; People lights up).
  const isActive =
    pathMatches(pathname, path) && !(paths ?? []).some((p) => p.length > path.length && pathMatches(pathname, p));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isSmallScreen) {
      document
        .getElementById('app-layout')
        ?.setAttribute('data-sidebar', 'closed');
    }
    props.onClick?.(e);
  };

  return (
    <Link
      data-slot="side-bar-menu-item"
      href={path}
      data-active={isActive ? 'true' : 'false'}
      className={cn(
        'group relative flex h-8 w-full items-center rounded-md px-3 text-sm transition-colors',
        'text-muted-foreground hover:bg-foreground/4 hover:text-foreground',
        'data-[active=true]:bg-foreground/8 data-[active=true]:text-foreground',
        'focus-visible:outline-primary focus-visible:outline-2',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Active Left Indicator */}
      {alternate === 'default' && (
        <span className="bg-foreground absolute top-2 bottom-2 left-4.5 w-px opacity-0 transition-opacity duration-200 group-data-[active=true]:opacity-100" />
      )}

      <div className={cn('flex w-full items-center gap-3', !Icon && 'pl-6')}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="capitalize">{children}</span>
      </div>
    </Link>
  );
}
