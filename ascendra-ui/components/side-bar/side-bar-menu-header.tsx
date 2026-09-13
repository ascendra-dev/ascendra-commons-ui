'use client';

import React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { ChevronDown } from 'lucide-react';

type IconType = React.ComponentType<{ className?: string }>;

type Props = React.ComponentProps<'button'> & {
  icon: IconType;
  children: React.ReactNode;
};

export function SideBarMenuHeader({
  className,
  children,
  icon: Icon,
  ...props
}: Props) {
  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const menu = e.currentTarget.closest('[data-open]');
    if (!menu) return;

    const hasActive = menu.querySelector('[data-active="true"]');

    // If active item exists → keep open and lock
    if (hasActive) {
      menu.setAttribute('data-open', 'true');
      menu.setAttribute('data-locked', 'true');
      return;
    }

    menu.removeAttribute('data-locked');

    const isOpen = menu.getAttribute('data-open') === 'true';
    menu.setAttribute('data-open', isOpen ? 'false' : 'true');
  };

  return (
    <button data-slot="side-bar-menu-header"
      type="button"
      onClick={handleToggle}
      className={cn(
        'group/btn hover:bg-foreground/4 focus-visible:outline-primary flex h-8 w-full cursor-pointer items-center justify-between rounded-md px-3 transition-colors group-data-[locked=true]:cursor-default group-data-[locked=true]:hover:bg-transparent focus-visible:outline-2',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Icon className="text-muted-foreground group-hover/btn:text-foreground group-data-[locked=true]:text-foreground h-3.5 w-3.5 transition-colors" />
        <span className="text-muted-foreground group-hover/btn:text-foreground group-data-[locked=true]:text-foreground transition-colors">
          {children}
        </span>
      </div>
      <ChevronDown className="text-muted-foreground group-hover/btn:text-foreground h-3.5 w-3.5 transition-transform duration-300 group-data-[locked=true]:opacity-0 group-data-[open=true]:rotate-180" />
    </button>
  );
}
