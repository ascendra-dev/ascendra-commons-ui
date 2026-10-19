'use client';

import { createContext, useContext, useRef } from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { useOverlayScrollbars } from '@/ascendra-ui/hooks/use-overlay-scrollbars';

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
  const hostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  // Only the slide-in menu ever overflows; docked, the viewport grows with its content.
  useOverlayScrollbars(hostRef, viewportRef, { y: 'scroll' });

  return (
    <SideBarContext.Provider value={{ persistent }}>
      <aside
        data-slot="side-bar"
        id="sidebar-root"
        className={cn(
          'group/side-bar bg-background fixed top-0 left-0 z-150 h-screen w-80 shrink-0 -translate-x-full transform transition-transform duration-300 group-data-[sidebar=open]:translate-x-0',
          // Docked on a large screen — unless the layout mode is 'menu', which keeps the slide-in menu above.
          'lg:not-in-data-[layout=menu]:static lg:not-in-data-[layout=menu]:z-90 lg:not-in-data-[layout=menu]:block lg:not-in-data-[layout=menu]:h-auto lg:not-in-data-[layout=menu]:w-62 lg:not-in-data-[layout=menu]:translate-x-0',
          // A SideBarLayoutToggle row sits in the page's top margin, so the sidebar's own content still lines up
          // with the page content beside it.
          'lg:not-in-data-[layout=menu]:has-[[data-slot=side-bar-layout-toggle]]:-mt-7',
          className
        )}
        {...props}
      >
        {/* The aside keeps its own positioning; the scrollbars attach to this wrapper. */}
        <div ref={hostRef} className="h-full">
          <div
            ref={viewportRef}
            data-slot="side-bar-viewport"
            // hides the native scrollbar until useOverlayScrollbars takes over
            data-overlayscrollbars-initialize=""
            className="h-full overflow-x-hidden overflow-y-auto lg:not-in-data-[layout=menu]:overflow-y-hidden"
          >
            {/* Padding lives here: the library resets the viewport's own. */}
            <div className="p-6 lg:not-in-data-[layout=menu]:p-0">{children}</div>
          </div>
        </div>
      </aside>
    </SideBarContext.Provider>
  );
}
