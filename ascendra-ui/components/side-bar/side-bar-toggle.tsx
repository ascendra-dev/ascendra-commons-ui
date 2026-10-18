'use client';

import { Menu } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * Opens the slide-in sidebar menu — shown on a small screen, and on a large one when the layout mode is 'menu'
 * (see SideBarLayoutToggle). `children` is the label beside the button.
 */
export function SideBarToggle({ children = 'Menu' }: { children?: React.ReactNode }) {
  const toggleSidebar = () => {
    const root = document.getElementById('app-layout');
    if (!root) return;

    const current = root.getAttribute('data-sidebar');
    root.setAttribute('data-sidebar', current === 'open' ? 'closed' : 'open');
  };

  return (
    <div
      data-slot="side-bar-toggle"
      className="flex items-center gap-4 lg:not-in-data-[layout=menu]:hidden"
    >
      <Button variant="secondary" size="icon" aria-label="Open menu" onClick={toggleSidebar}>
        <Menu className="text-muted-foreground size-3.5" />
      </Button>
      <span
        className="text-muted-foreground cursor-pointer font-semibold"
        onClick={toggleSidebar}
      >
        {children}
      </span>
    </div>
  );
}
