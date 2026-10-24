'use client';

import { cn } from '@/ascendra-ui/shadcn';
import { overlayClasses } from '@/ascendra-ui/components/ui/overlay-styles';

export function SideBarOverlay() {
  const closeSidebar = () => {
    const root = document.getElementById('app-layout');
    if (!root) return;
    root.setAttribute('data-sidebar', 'closed');
  };

  return (
    <div
      data-slot="side-bar-overlay"
      id="sidebar-overlay"
      onClick={closeSidebar}
      className={cn(
        'pointer-events-none fixed inset-0 z-140 opacity-0 transition-opacity duration-300 group-data-[sidebar=open]:pointer-events-auto group-data-[sidebar=open]:opacity-100 lg:not-in-data-[layout=menu]:hidden',
        ...overlayClasses
      )}
    />
  );
}
