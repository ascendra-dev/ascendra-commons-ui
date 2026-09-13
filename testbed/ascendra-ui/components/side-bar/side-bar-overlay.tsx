'use client';

import { cn } from '@/ascendra-ui/shadcn';

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
        'pointer-events-none fixed inset-0 z-140 bg-black/40 opacity-0 transition-opacity duration-300 group-data-[sidebar=open]:pointer-events-auto group-data-[sidebar=open]:opacity-100 lg:hidden',
        // Dot-grid texture layered over the semi-transparent base
        'bg-[radial-gradient(rgba(255,255,255,0.07)_2px,transparent_2px)]',
        'bg-size-[20px_20px]'
      )}
    />
  );
}
