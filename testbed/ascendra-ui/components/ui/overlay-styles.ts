/**
 * The backdrop behind every modal surface — Dialog, Drawer, the slide-in SideBar (a Sheet has none): a tint, a fine dot grid and a
 * blur, one look everywhere. Light: a lighter tint with a soft vignette (darker at the edges, so the eye goes to the
 * middle). Dark: a deeper tint, no vignette — on a dark page a light tint barely separates the surface from it.
 * Typed arbitrary values (`color:`, `image:`) keep tint and texture apart for Tailwind and tailwind-merge.
 */
export const overlayClasses = [
  "bg-[color:rgba(10,10,16,0.30)] dark:bg-[color:rgba(0,0,0,0.62)]",
  "bg-[image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1.2px),radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.28)_100%)] bg-size-[12px_12px,100%_100%]",
  "dark:bg-[image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1.2px)] dark:bg-size-[14px_14px]",
  "supports-backdrop-filter:backdrop-blur-[5px] dark:supports-backdrop-filter:backdrop-blur-[8px]",
];

/**
 * Behind a maximized Card: the same dots, a lighter tint — the page dims, but the card's edge still reads against it
 * (the card adds a hairline outline of its own).
 */
export const maximizeOverlayClasses = [
  "bg-[color:rgba(10,10,16,0.20)] dark:bg-[color:rgba(0,0,0,0.35)]",
  "bg-[image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1.2px)] bg-size-[12px_12px]",
  "dark:bg-[image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1.2px)] dark:bg-size-[14px_14px]",
  "supports-backdrop-filter:backdrop-blur-[3px] dark:supports-backdrop-filter:backdrop-blur-[5px]",
];
