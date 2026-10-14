/** Space left between the calendar and the bottom of the window after scrolling. */
const BOTTOM_GAP = 8;

/**
 * The calendar can't shrink, so when it fits neither below nor above its field (the area under the top bars,
 * `topInset`, doesn't count) this scrolls the page just enough for it to open in full below the field — what a user
 * would otherwise do by hand. Never scrolls the field itself under the top bars. Call once the open popover has
 * rendered.
 */
export function scrollCalendarIntoRoom(content: HTMLElement, topInset: number, sideOffset: number) {
  const trigger = document.querySelector(`[aria-controls="${content.id}"]`);
  // An editable picker anchors on the whole field, not on its calendar button.
  const field = trigger?.closest('[data-slot$="picker-trigger"]') ?? trigger;
  if (!field) return;

  const { top, bottom } = field.getBoundingClientRect();
  const height = content.offsetHeight; // layout height — unaffected by the open animation's scale
  const roomBelow = window.innerHeight - bottom - sideOffset;
  const roomAbove = top - sideOffset - topInset;
  if (height <= roomBelow || height <= roomAbove) return;

  const scroll = Math.min(height - roomBelow + BOTTOM_GAP, top - topInset);
  if (scroll > 0) window.scrollBy({ top: scroll, behavior: 'smooth' });
}
