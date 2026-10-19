'use client';

import { createContext, useContext } from 'react';
import { cn } from '@/ascendra-ui/shadcn';

type SideBarContextValue = { persistent: boolean };

const SideBarContext = createContext<SideBarContextValue>({ persistent: false });

export function useSideBar() {
  return useContext(SideBarContext);
}

export function SideBar({
  persistent = false,
  className,
  children,
  ...props
}: React.ComponentProps<'aside'> & { persistent?: boolean }) {
  return (
    <SideBarContext.Provider value={{ persistent }}>
      <aside
        data-slot="side-bar"
        id="sidebar-root"
        className={cn(
          'group/side-bar bg-background fixed top-0 left-0 z-150 h-screen w-80 shrink-0 -translate-x-full transform gap-8 overflow-x-hidden overflow-y-auto p-6 transition-transform duration-300 group-data-[sidebar=open]:translate-x-0',
          // Docked on a large screen — unless the layout mode is 'menu', which keeps the slide-in menu above.
          'lg:not-in-data-[layout=menu]:static lg:not-in-data-[layout=menu]:z-90 lg:not-in-data-[layout=menu]:block lg:not-in-data-[layout=menu]:h-auto lg:not-in-data-[layout=menu]:w-62 lg:not-in-data-[layout=menu]:translate-x-0 lg:not-in-data-[layout=menu]:overflow-y-hidden lg:not-in-data-[layout=menu]:p-0',
          // A SideBarLayoutToggle row sits in the page's top margin, so the sidebar's own content still lines up
          // with the page content beside it.
          'lg:not-in-data-[layout=menu]:has-[>[data-slot=side-bar-layout-toggle]]:-mt-7',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </SideBarContext.Provider>
  );
}
