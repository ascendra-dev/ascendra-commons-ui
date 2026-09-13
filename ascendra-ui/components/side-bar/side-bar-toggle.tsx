'use client';

import { Menu } from 'lucide-react';
import { Button } from '../ui/button';

export function SideBarToggle() {
  const toggleSidebar = () => {
    const root = document.getElementById('app-layout');
    if (!root) return;

    const current = root.getAttribute('data-sidebar');
    root.setAttribute('data-sidebar', current === 'open' ? 'closed' : 'open');
  };

  return (
    <div
      data-slot="side-bar-toggle"
      className="flex items-center gap-4 lg:hidden"
    >
      <Button variant="secondary" size="icon" onClick={toggleSidebar}>
        <Menu className="text-muted-foreground size-3.5" />
      </Button>
      <span
        className="text-muted-foreground cursor-pointer font-semibold"
        onClick={() => toggleSidebar}
      >
        User & Authentication
      </span>
    </div>
  );
}
