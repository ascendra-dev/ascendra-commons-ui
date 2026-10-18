/**
 * How the page lays out on a large screen, chosen per device (localStorage — not per user):
 * - 'centered'   — the default: content capped at the app container's max width, margins either side.
 * - 'full-width' — the sidebar stays docked, the content uses the whole width.
 * - 'menu'       — full width, and the sidebar becomes the small-screen slide-in menu (SideBarToggle opens it).
 *
 * Applied as `data-layout` on <html> ('centered' = no attribute), which components read through Tailwind's
 * `in-data-[layout=…]` variants. Below `lg` every mode looks the same — the small-screen layout already is
 * full width with the slide-in menu.
 */
export type LayoutMode = 'centered' | 'full-width' | 'menu';

export const LAYOUT_MODES: LayoutMode[] = ['centered', 'full-width', 'menu'];

const STORAGE_KEY = 'ascendra:layout-mode';
const CHANGE_EVENT = 'ascendra:layout-mode-change';

/**
 * Runs before first paint (PageLayout renders it inline), so a saved mode never flashes the centered layout
 * first. <html> carries suppressHydrationWarning already (next-themes needs it too).
 */
export const LAYOUT_MODE_SCRIPT = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}');if(m==='full-width'||m==='menu')document.documentElement.setAttribute('data-layout',m)}catch(e){}})()`;

export function readLayoutMode(): LayoutMode {
  const mode = document.documentElement.getAttribute('data-layout');
  return mode === 'full-width' || mode === 'menu' ? mode : 'centered';
}

export function setLayoutMode(mode: LayoutMode): void {
  if (mode === 'centered') document.documentElement.removeAttribute('data-layout');
  else document.documentElement.setAttribute('data-layout', mode);
  // A slide-in menu left open would pop up again the next time 'menu' is chosen.
  document.getElementById('app-layout')?.setAttribute('data-sidebar', 'closed');
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // storage blocked — the mode still applies until the page reloads
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeLayoutMode(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
