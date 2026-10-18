import { cn } from '@/ascendra-ui/shadcn';
import { LAYOUT_MODE_SCRIPT } from './layout-mode';
import { SCROLLBAR_REVEAL_SCRIPT } from './scrollbar-reveal';

export function PageLayout({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-layout"
      id="app-layout"
      data-sidebar="closed"
      className={cn(
        'group relative grid min-h-screen flex-1 grid-cols-1 grid-rows-[auto_auto_1fr]',
        className
      )}
      {...props}
    >
      {/* The device's saved layout mode, applied before first paint — see layout-mode.ts. */}
      <script dangerouslySetInnerHTML={{ __html: LAYOUT_MODE_SCRIPT }} />
      {/* Desktop scrollbars show only while scrolling — see scrollbar-reveal.ts. */}
      <script dangerouslySetInnerHTML={{ __html: SCROLLBAR_REVEAL_SCRIPT }} />
      {children}
    </div>
  );
}
