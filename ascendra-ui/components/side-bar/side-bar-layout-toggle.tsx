'use client';

import { useSyncExternalStore } from 'react';
import type { IconType } from 'react-icons';
import { LuChevronsLeftRight, LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { LAYOUT_MODES, readLayoutMode, setLayoutMode, subscribeLayoutMode, type LayoutMode } from '../layout/layout-mode';

// What a click does next, named for the mode it switches to.
const NEXT_ACTION: Record<LayoutMode, { icon: IconType; label: string }> = {
  centered: { icon: LuChevronsLeftRight, label: 'Use full width' },
  'full-width': { icon: LuPanelLeftClose, label: 'Hide sidebar' },
  menu: { icon: LuPanelLeftOpen, label: 'Show sidebar' },
};

/**
 * Put first inside SideBar. On a large screen it cycles the page layout: centered → full width → menu (the
 * sidebar becomes the small-screen slide-in menu) → centered, remembered per device. Shows on sidebar hover or
 * keyboard focus; always on a touch screen (no hover there) and inside the open slide-in menu. Hidden below `lg`,
 * where every mode looks the same.
 */
export function SideBarLayoutToggle({ className }: { className?: string }) {
  const mode = useSyncExternalStore(subscribeLayoutMode, readLayoutMode, () => 'centered' as const);
  const { icon: Icon, label } = NEXT_ACTION[mode];
  const next = LAYOUT_MODES[(LAYOUT_MODES.indexOf(mode) + 1) % LAYOUT_MODES.length];

  return (
    <div data-slot="side-bar-layout-toggle" className={cn('hidden justify-end lg:flex', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={() => setLayoutMode(next)}
            className="size-7 opacity-0 transition-opacity group-hover/side-bar:opacity-100 focus-visible:opacity-100 in-data-[layout=menu]:opacity-100 pointer-coarse:opacity-100"
          >
            <Icon className="text-muted-foreground size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}
